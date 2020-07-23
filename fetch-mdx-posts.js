// Code credit to Chris Biscardi

const fs = require("fs").promises;
const path = require("path");
const frontmatter = require("gray-matter");
const mdx = require("@mdx-js/mdx");
const rehypeSlug = require("rehype-slug");
const cloudinary = require("rehype-local-image-to-cloudinary");
const rehypePrism = require("./rehype-prism-plugin");
const globby = require("globby");

exports.sourceData = async ({ createPage, ...options }) => {
  console.log("sourceData");
  // const files = await fs.readdir("./content/posts/");

  const files = await globby("./content", {
    expandDirectories: { extensions: ["md*"] },
  });

  return Promise.all(
    files.map(async (filename) => {
      console.log("=====================");
      console.log("filename::", filename);
      console.log("=====================");
      const file = await fs.readFile(filename, "utf-8");
      let compiledMDX;

      const { data, content } = frontmatter(file);

      try {
        compiledMDX = await mdx(content, {
          rehypePlugins: [
            rehypePrism,
            rehypeSlug,
            [
              cloudinary,
              {
                baseDir: path.join(__dirname, "content", "posts", filename),
                uploadFolder: "toast-test",
              },
            ],
          ],
        });
      } catch (e) {
        console.log(e);
        throw e;
      }

      await createPage({
        module: `/** @jsx mdx */
            import {mdx} from '@mdx-js/preact';
            ${compiledMDX}`,
        slug: filename,
        data: { ...data, slug: filename },
      });

      // Data to be stored in `mdx-posts.json` file
      console.log("=====================");
      console.log(`FILENAME:::${filename}`);
      console.log("=====================");
      return {
        ...data,
        slug: filename,
      };
    })
  );
};
