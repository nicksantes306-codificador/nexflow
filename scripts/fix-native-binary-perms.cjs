const fs = require("fs");
const path = require("path");

const ELF_MAGIC = Buffer.from([0x7f, 0x45, 0x4c, 0x46]); // \x7fELF

function walk(dir, fixed) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, fixed);
      continue;
    }
    if (!entry.isFile()) continue;
    try {
      const stat = fs.statSync(full);
      if (stat.mode & 0o111) continue; // already executable
      const fd = fs.openSync(full, "r");
      const head = Buffer.alloc(4);
      fs.readSync(fd, head, 0, 4, 0);
      fs.closeSync(fd);
      if (head.equals(ELF_MAGIC)) {
        fs.chmodSync(full, 0o755);
        fixed.push(full);
      }
    } catch {
      // unreadable or race condition — skip
    }
  }
}

const root = path.join(__dirname, "..", "node_modules");
const fixed = [];
walk(root, fixed);
if (fixed.length) {
  console.log(`[fix-native-binary-perms] chmod +x applied to ${fixed.length} native binaries`);
}
