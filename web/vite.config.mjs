import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  envDir: resolve(root, ".."),
  publicDir: resolve(root, "../public"),
  base: "/",
  build: {
    outDir: resolve(root, "../pages-dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(root, "index.html"),
        extension: resolve(root, "extension.html"),
        work: resolve(root, "work.html"),
        journal: resolve(root, "journal.html"),
        about: resolve(root, "about.html"),
        admin: resolve(root, "admin.html"),
      },
    },
  },
});
