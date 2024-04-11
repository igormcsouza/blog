import { GitHub, Instagram, LinkedIn } from "@mui/icons-material";
import XIcon from '@mui/icons-material/X';
import Link from "next/link";
import { personalInfo } from "@/lib/utils";

export default function Footer() {
  return (
    <footer className="py-6 lg:py-10">
      <hr className="my-5"/>
      <div className="flex flex-col sm:flex-row justify-between gap-8 items-center text-muted-foreground">
        <ul className="flex flex-col items-center gap-2 px-4">
          {["", "#about", "#projects", "#news"].map((section) => (
            <li key={section}>
              <Link className="hover:underline underline-offset-4" href={`https://igormcsouza.github.io/${section}`}>
                {section === "" ? "Home" : section.slice(1)[0].toUpperCase() + section.slice(2)}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="flex gap-5 flex-wrap">
          <li>
            <Link href={personalInfo.socialMedias.github}>
              <GitHub />
              <span className="sr-only">GitHub</span>
            </Link>
          </li>
          <li>
            <Link href={personalInfo.socialMedias.x}>
              <XIcon />
              <span className="sr-only">Twitter</span>
            </Link>
          </li>
          <li>
            <Link href={personalInfo.socialMedias.linkedin}>
              <LinkedIn />
              <span className="sr-only">LinkedIn</span>
            </Link>
          </li>
          <li>
            <Link href={personalInfo.socialMedias.instagram}>
              <Instagram />
              <span className="sr-only">Instagram</span>
            </Link>
          </li>
        </ul>
        <div className="sm:max-w-28 text-center">Need some help? Talk to me thru the <a className="font-bold underline" href={`mailto:${personalInfo.email}`}>mail</a>.</div>
      </div>
      <div className="flex justify-center pt-3">
        <p className="text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} {personalInfo.name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}