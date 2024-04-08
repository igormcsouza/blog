# My personal Blog

[![Deploy Next.js site to Pages](https://github.com/igormcsouza/blog/actions/workflows/nextjs.yml/badge.svg)](https://github.com/igormcsouza/blog/actions/workflows/nextjs.yml)

The idea of having a personal blog, is quite old, but I think I've never done some much work to make it happen like now! That's good, some good content is coming soon! Well let's see what we can do with this great beauty!

## How to develop this blog?

This project is written in [NextJS 14](https://nextjs.org/docs) and [Velite](https://velite.js.org/guide/introduction), which transform every `.mdx` file I have in [content/](./content/) to a page on the blog website.

This is the only thing needed to add new posts, the post list and the routing will be automatically updated by the project.

The `.mdx` has some cool features like `<Callout />`, `NextJS <Image />`, and the code line highlights. All from `.mdx` patterns. If new image has to be added, place it under [public/static](./public/static/) folder with the correct naming convention. On the `.mdx` file it will be under `/blog/static/`.

Before anything, install the dependencies using:

```bash
npm i
```

This project has a [.devcontainer](./.devcontainer) which sets up a **Vscode Development Environment** which can be quite useful to split development from host resources.

Start a development server by running:

```bash
npm run dev
```

A development server will start at `http://localhost:3000`.

After starting the development server, velite also needs to be started to keep track of the `.mdx` changes and update the js files, to make that happen run:

```bash
npm run velite
```

Which will start a watch command for every change on [content/](./content/), updating the files and paths of the project for new and modified `.mdx` files.

## See production build before pushing

Because the production build can be quite different, one might want to build it and see it in action before pushing, archive that by running:

```bash
npm run build
npm run start
```

The production server will be started on `http://localhost:3000`.

## How to publish the blog changes to github?

There is an [action](./.github/workflows/nextjs.yml) that prepares the project and publish it to Github Pages, so no neet to do anything else, just make sure a production build is creatable.