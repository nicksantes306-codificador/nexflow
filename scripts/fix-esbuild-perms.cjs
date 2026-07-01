const fs = require("fs");
const path = require("path");

try {
  const esbuildPkg = require.resolve("esbuild/package.json");
  const binPath = path.join(path.dirname(esbuildPkg), "bin", "esbuild");
  if (fs.existsSync(binPath)) {
    fs.chmodSync(binPath, 0o755);
  }
} catch {
  // esbuild not installed or already executable — nothing to do
}
