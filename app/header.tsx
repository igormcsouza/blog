import { Button } from "@/components/ui/button";
import { ItalicIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function Header({ children }: { children: ReactNode }){
  return (
    <header className="py-6 lg:py-10">
      <div className="flex gap-4 flex-row justify-between md:gap-8">
        <Link className="hidden sm:inline-block" href="/">
          <ItalicIcon size={36}/>
        </Link>
        <nav className="my-auto text-xl">
          <ul className="flex flex-wrap sm:gap-16">
            <li>
              <a href="https://igormcsouza.github.io/">
                <Button variant={"ghost"}>Home</Button>
              </a>
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
        {children}
      </div>
    </header>
  );
}