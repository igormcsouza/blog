import ChangeThemeButton from "@/components/change-theme-button";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Header(){
  return (
    <header className="py-6 lg:py-10 print:hidden">
      <div className="flex gap-4 flex-row justify-between md:gap-8">
        <Link className="hidden sm:inline-block" href="/" prefetch={false}>
          <Logo size={36}/>
        </Link>
        <nav className="my-auto text-xl">
          <ul className="flex flex-wrap sm:gap-16">
            <li>
              {/* Same-origin but outside this app's basePath/build (a
                  separate deployed Next app). Without prefetch={false},
                  Next's viewport prefetch treats it as an internal route,
                  fetches that app's RSC payload, then tries to load its
                  chunks under this app's /blog/_next path — the root cause
                  of #48. */}
              <Link href="https://igormcsouza.github.io/" prefetch={false}>
                <Button variant={"ghost"}>Home</Button>
              </Link>
            </li>
            <li>
              <a href="/blog">
                <Button variant={"ghost"}>Blog</Button>
              </a>
            </li>
            <li>
              <a href="/blog/tags">
                <Button variant={"ghost"}>Tags</Button>
              </a>
            </li>
          </ul>
        </nav>
        <ChangeThemeButton />
      </div>
    </header>
  );
}