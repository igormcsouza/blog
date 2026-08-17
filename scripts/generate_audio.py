#!/usr/bin/env python3
"""Synthesize narration audio for every post in .audio-build/manifest.json
and upload it (mp3 + word-timing JSON) to S3, skipping posts whose audio
is already up to date.

Reads text produced by scripts/extract-audio-text.ts. Run via:

    uv run python scripts/generate_audio.py [--local-out DIR]

Env vars:
    AUDIO_S3_BUCKET   S3 bucket name (required unless --local-out)
    AWS_REGION        AWS region for the S3 client
    TTS_VOICE         edge-tts voice name (default: en-US-AriaNeural)
    AUDIO_S3_PREFIX   S3 key prefix (default: audio/)
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

import boto3
import edge_tts
from botocore.exceptions import ClientError

TTS_VOICE = "en-US-AvaNeural"
MANIFEST_PATH = Path(".audio-build/manifest.json")
RETRY_ATTEMPTS = 3
RETRY_BASE_DELAY_SECONDS = 2
SLEEP_BETWEEN_POSTS_SECONDS = 2


@dataclass
class PostResult:
    slug: str
    status: str  # "generated" | "skipped" | "failed"
    detail: str = ""


@dataclass
class SynthesizedAudio:
    mp3_bytes: bytes = field(default_factory=bytes)
    words: list = field(default_factory=list)


class FatalConfigError(RuntimeError):
    """Raised when S3 access is misconfigured in a way retries can't fix."""


async def synthesize(text: str, voice: str) -> SynthesizedAudio:
    communicate = edge_tts.Communicate(text, voice, boundary="WordBoundary")
    audio_chunks = bytearray()
    words = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append(
                {
                    "t": chunk["text"],
                    "s": chunk["offset"] // 10_000,
                    "d": chunk["duration"] // 10_000,
                }
            )
    return SynthesizedAudio(mp3_bytes=bytes(audio_chunks), words=words)


async def synthesize_with_retry(text: str, voice: str) -> SynthesizedAudio:
    last_error: Exception | None = None
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            return await synthesize(text, voice)
        except Exception as exc:  # noqa: BLE001 - edge-tts throws transient errors
            last_error = exc
            if attempt < RETRY_ATTEMPTS:
                delay = RETRY_BASE_DELAY_SECONDS * (2 ** (attempt - 1))
                print(
                    f"  synthesis attempt {attempt} failed ({exc}); retrying in {delay}s",
                    file=sys.stderr,
                )
                time.sleep(delay)
    assert last_error is not None
    raise last_error


def check_needs_generation(
    s3, bucket: str, prefix: str, slug: str, text_hash: str, voice: str
) -> bool:
    key = f"{prefix}{slug}.mp3"
    try:
        head = s3.head_object(Bucket=bucket, Key=key)
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "")
        status = exc.response.get("ResponseMetadata", {}).get(
            "HTTPStatusCode", 0
        )
        if error_code in ("404", "NoSuchKey", "NotFound") or status == 404:
            return True
        if status == 403 or error_code == "403":
            raise FatalConfigError(
                f"S3 head_object on {key} returned 403 — this almost always "
                "means the IAM policy is missing s3:ListBucket, which makes "
                "a missing key look like a permissions error instead of a "
                "404. Fix the IAM policy before rerunning."
            ) from exc
        raise

    metadata = head.get("Metadata", {})
    if metadata.get("text-hash") == text_hash and metadata.get("voice") == voice:
        return False
    return True


def upload_with_retry(s3, bucket: str, key: str, body: bytes, **kwargs) -> None:
    last_error: Exception | None = None
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            s3.put_object(Bucket=bucket, Key=key, Body=body, **kwargs)
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt < RETRY_ATTEMPTS:
                delay = RETRY_BASE_DELAY_SECONDS * (2 ** (attempt - 1))
                print(
                    f"  upload attempt {attempt} for {key} failed ({exc}); retrying in {delay}s",
                    file=sys.stderr,
                )
                time.sleep(delay)
    assert last_error is not None
    raise last_error


def write_local(out_dir: Path, slug: str, audio: SynthesizedAudio) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / f"{slug}.json").write_text(
        json.dumps({"words": audio.words}), encoding="utf8"
    )
    (out_dir / f"{slug}.mp3").write_bytes(audio.mp3_bytes)


def upload_s3(
    s3, bucket: str, prefix: str, slug: str, text_hash: str, voice: str,
    audio: SynthesizedAudio,
) -> None:
    metadata = {"text-hash": text_hash, "voice": voice}
    cache_control = "public, max-age=3600"

    upload_with_retry(
        s3,
        bucket,
        f"{prefix}{slug}.json",
        json.dumps({"words": audio.words}).encode("utf8"),
        ContentType="application/json",
        CacheControl=cache_control,
        Metadata=metadata,
    )
    upload_with_retry(
        s3,
        bucket,
        f"{prefix}{slug}.mp3",
        audio.mp3_bytes,
        ContentType="audio/mpeg",
        CacheControl=cache_control,
        Metadata=metadata,
    )


def print_summary(results: list[PostResult]) -> None:
    print("\nSummary:")
    print(f"{'slug':<30} {'status':<10} detail")
    for r in results:
        print(f"{r.slug:<30} {r.status:<10} {r.detail}")
    counts = {"generated": 0, "skipped": 0, "failed": 0}
    for r in results:
        counts[r.status] = counts.get(r.status, 0) + 1
    print(
        f"\n{counts['generated']} generated, {counts['skipped']} skipped, "
        f"{counts['failed']} failed"
    )


async def run(args: argparse.Namespace) -> int:
    if not MANIFEST_PATH.exists():
        print(
            f"Missing {MANIFEST_PATH} — run scripts/extract-audio-text.ts first.",
            file=sys.stderr,
        )
        return 1

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf8"))
    voice = args.voice
    prefix = args.prefix
    text_dir = MANIFEST_PATH.parent

    s3 = None
    if not args.local_out:
        if not args.bucket:
            print(
                "AUDIO_S3_BUCKET is required unless --local-out is used.",
                file=sys.stderr,
            )
            return 1
        s3 = boto3.client("s3", region_name=args.region)

    results: list[PostResult] = []
    posts = manifest.get("posts", [])

    for index, post in enumerate(posts):
        slug = post["slug"]
        text_hash = post["textHash"]
        text_path = text_dir / post["textFile"]

        if s3 is not None:
            try:
                needs_generation = check_needs_generation(
                    s3, args.bucket, prefix, slug, text_hash, voice
                )
            except FatalConfigError as exc:
                print(f"FATAL: {exc}", file=sys.stderr)
                return 1

            if not needs_generation:
                print(f"SKIP  {slug} (unchanged)")
                results.append(PostResult(slug=slug, status="skipped"))
                continue

        text = text_path.read_text(encoding="utf8")
        print(f"GEN   {slug}")
        try:
            audio = await synthesize_with_retry(text, voice)
            if s3 is not None:
                upload_s3(s3, args.bucket, prefix, slug, text_hash, voice, audio)
            else:
                write_local(Path(args.local_out), slug, audio)
            results.append(PostResult(slug=slug, status="generated"))
        except Exception as exc:  # noqa: BLE001
            print(f"FAIL  {slug}: {exc}", file=sys.stderr)
            results.append(PostResult(slug=slug, status="failed", detail=str(exc)))

        if index < len(posts) - 1:
            time.sleep(SLEEP_BETWEEN_POSTS_SECONDS)

    print_summary(results)
    return 1 if any(r.status == "failed" for r in results) else 0


def parse_args() -> argparse.Namespace:
    import os

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--local-out",
        default=None,
        help="Write mp3/json pairs to this directory instead of S3 (no AWS calls).",
    )
    parser.add_argument(
        "--voice",
        default=os.environ.get("TTS_VOICE", TTS_VOICE),
        help="edge-tts voice name.",
    )
    parser.add_argument(
        "--bucket",
        default=os.environ.get("AUDIO_S3_BUCKET"),
        help="S3 bucket name (env: AUDIO_S3_BUCKET).",
    )
    parser.add_argument(
        "--region",
        default=os.environ.get("AWS_REGION"),
        help="AWS region (env: AWS_REGION).",
    )
    parser.add_argument(
        "--prefix",
        default=os.environ.get("AUDIO_S3_PREFIX", "audio/"),
        help="S3 key prefix (env: AUDIO_S3_PREFIX, default: audio/).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    exit_code = asyncio.run(run(args))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
