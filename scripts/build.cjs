const { execFileSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const backend = path.join(root, "backend");
const run = (args, cwd = backend) =>
  execFileSync(process.execPath, args, { cwd, stdio: "inherit" });
run([path.join(backend, "node_modules/prisma/build/index.js"), "generate"]);
const tsc = path.join(backend, "node_modules/typescript/bin/tsc");
for (const name of ["errors", "messages", "jwt", "logger", "db", "repository"])
  run([tsc, "-p", `core/${name}/tsconfig.json`]);
run([tsc]);
run(
  [path.join(root, "web/node_modules/typescript/bin/tsc"), "--noEmit"],
  path.join(root, "web"),
);
run(
  [path.join(root, "web/node_modules/vite/bin/vite.js"), "build"],
  path.join(root, "web"),
);

// SR
