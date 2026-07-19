# Development Workflow

This repo uses a structured, multi-agent workflow for implementing GitHub
issues as features. It was established while building issue #31 (previous/next
post navigation) and should be followed for comparable feature work.

## 1. Start from the issue

Read the target issue (`gh issue view <n>`) and wait for the user's go-ahead
before doing anything else. Don't assume scope beyond what's written — ask.

## 2. Plan (research-heavy, no code changes)

Enter plan mode for anything beyond a trivial fix. Inside plan mode:

**Explore the codebase in parallel, cheaply.** Spawn `Explore` subagents (model:
`haiku`) for each distinct area that needs mapping — e.g. one for "where does
the data/rendering for X live", another for "how does the test suite for X
work". Keep each agent scoped to a narrow, concrete question; report back
file:line references, not code proposals.

**Research prior art.** Before designing, search for how other well-known
products/blogs/frameworks solve the same problem (e.g. Astro/Ghost prev-next
post nav). Copy the spirit of proven UX/architecture patterns and adapt them
to this repo's conventions — don't invent a bespoke solution when a common one
exists and don't literally port foreign code.

**Design the implementation.** Spawn a `Plan` subagent (model: `fable`) with
the full context gathered above: exact file paths, existing helpers/types to
reuse, the external reference patterns, and any decisions already confirmed
with the user. Ask it to read the actual critical files itself and produce a
concrete, file-by-file plan — not just a description of the problem.

**Resolve ambiguity explicitly.** Use `AskUserQuestion` for anything with more
than one reasonable interpretation (e.g. where a UI element should live,
which direction "next" points) before finalizing the plan. Don't guess on
product decisions.

**Verify before locking the plan.** Read the critical files identified above
yourself to confirm the plan's claims about current code are accurate, then
write the final plan (context/why, confirmed decisions, concrete steps,
verification steps) and request approval via `ExitPlanMode`.

## 3. Implement

Once approved, implement with the full-capability model (Sonnet), not the
cheaper exploration models.

- Work in an isolated git worktree/branch, never directly on `main`.
- Follow the plan file step by step; re-read it if the session is long.
- **New features require E2E test coverage.** This repo has no unit test
  framework — Playwright (`e2e/`) is the only test layer. Any new
  user-facing behavior needs a spec added there, following the existing
  one-concern-per-file convention and query patterns (`getByRole`, scoped
  locators, URL regex assertions).
- Run `npm run lint`, and the full `test:e2e` suite — confirm no regressions,
  not just that the new spec passes.
- For UI changes, do a visual check (screenshot or `npm run dev`), not just
  DOM-presence assertions — a passing test can still look wrong.

## 4. Before opening a PR

Verify the branch's base isn't stale — `git fetch origin <default-branch>` and
compare against `origin/<default-branch>` HEAD. Branches/worktrees can be cut
from a cached ref that's behind a since-merged PR (including squash-merges
that change commit hashes); rebase/reset onto the current tip before
finishing, or content that depends on recently-merged work (e.g. hard-coded
post ordering in tests) will be wrong.

## 5. Commit and open the PR

- Commit only the intended files; check `git status`/`git diff` before
  staging broadly.
- Open a **draft** PR unless told otherwise.
- **PR title:** describe the change; don't embed the issue number in it.
- **PR body:** include a short summary, a test plan, and a line reading
  `Closes #<issue>` — GitHub auto-closes the linked issue when the PR merges.
