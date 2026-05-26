import { build, context } from "esbuild";
import { readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";

const rootDir = process.cwd();
const srcDir = resolve(rootDir, "src");
const isWatch = process.argv.includes("--watch");

async function getSourceFiles() {
  const entries = await readdir(srcDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts"))
    .map((entry) => `./src/${entry.name}`)
    .sort();
}

const sourceFiles = await getSourceFiles();

if (sourceFiles.length === 0) {
  console.error("No TypeScript files found in src/*.ts");
  process.exit(1);
}

const buildOptions = {
  entryPoints: sourceFiles,
  outdir: rootDir,
  outExtension: { ".js": ".js" },
  entryNames: "[name]",
  minify: true,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  logLevel: "info"
};

if (isWatch) {
  const ctx = await context(buildOptions);
  await ctx.watch();
  const outputFiles = sourceFiles.map((file) => `${basename(file, ".ts")}.js`).join(", ");
  console.log(`Watching src/*.ts and writing bundled/minified ${outputFiles}...`);

  process.on("SIGINT", async () => {
    await ctx.dispose();
    process.exit(0);
  });
} else {
  await build(buildOptions);
}
