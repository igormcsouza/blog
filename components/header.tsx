import ChangeThemeButton from "@/components/change-theme-button";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Header(){
  return (
    <header className="py-6 lg:py-10">
      <div className="flex gap-4 flex-row justify-between md:gap-8">
        <Link className="hidden sm:inline-block" href="/">
          <Logo size={36}/>
        </Link>
        <nav className="my-auto text-xl">
          <ul className="flex flex-wrap sm:gap-16">
            <li>
              <Link href="https://igormcsouza.github.io/">
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