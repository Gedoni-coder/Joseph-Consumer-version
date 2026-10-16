const { execFileSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
execFileSync(
  process.execPath,
  [
    path.join(root, "node_modules/pnpm/bin/pnpm.cjs"),
    "--config.manage-package-manager-versions=false",
    "install",
    "--frozen-lockfile",
  ],
  {
    cwd: path.join(root, "backend"),
    stdio: "inherit",
    env: { ...process.env, HUSKY: "0" },
  },
);
execFileSync(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["ci", "--prefix", "web"],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
);
