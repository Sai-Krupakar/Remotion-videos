import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { build } from "esbuild";

const outDir = mkdtempSync(join(tmpdir(), "stickman-tests-"));
let failed = false;
try {
  for (const file of readdirSync("tests").filter((name) => name.endsWith(".test.ts"))) {
    const outfile = join(outDir, file.replace(/\.ts$/, ".cjs"));
    await build({ entryPoints: [resolve("tests", file)], bundle: true, platform: "node", outfile, logLevel: "error" });
    const result = spawnSync(process.execPath, [outfile], { stdio: "inherit" });
    if (result.status !== 0) {
      console.error(`FAILED: ${file}`);
      failed = true;
    }
  }
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
