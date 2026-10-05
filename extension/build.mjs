import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: [
    "src/inject.ts",
    "src/content.ts",
    "src/background.ts",
    "src/popup.ts",
  ],
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome111",
  sourcemap: true,
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("watching for changes...");
} else {
  await esbuild.build(options);
}
