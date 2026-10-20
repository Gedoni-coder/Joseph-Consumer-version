// Isolated development cluster. Never uses or migrates an externally supplied DATABASE_URL.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync, spawn } = require("node:child_process");
const backend = path.resolve(__dirname, "..");
const local = path.resolve(backend, "../.local");
const pgBin = process.env.JOSEPH_PG_BIN || "C:/Program Files/PostgreSQL/17/bin";
const data = path.join(local, "postgres");
fs.mkdirSync(local, { recursive: true });
const configFile = path.join(local, "runtime.json");
if (!fs.existsSync(configFile))
  fs.writeFileSync(
    configFile,
    JSON.stringify({
      password: crypto.randomBytes(32).toString("hex"),
      jwt: crypto.randomBytes(48).toString("hex"),
      refresh: crypto.randomBytes(48).toString("hex"),
    }),
    { mode: 0o600, flag: "wx" },
  );
const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
const env = {
  ...process.env,
  NODE_ENV: "development",
  DATABASE_URL: `postgresql://joseph_local:${config.password}@127.0.0.1:55439/postgres`,
  JWT_SECRET: config.jwt,
  JWT_REFRESH_SECRET: config.refresh,
  FRONTEND_URL:
    "http://127.0.0.1:5180,http://127.0.0.1:5178,http://localhost:5180",
  PORT: "4000",
  HOST: "127.0.0.1",
  SKIP_DB: "false",
};
const run = (file, args, cwd = backend) =>
  execFileSync(file, args, { cwd, env, stdio: "inherit", windowsHide: true });
const pg = (name, args) =>
  run(
    path.join(pgBin, name + (process.platform === "win32" ? ".exe" : "")),
    args,
  );
const prisma = (...args) =>
  run(process.execPath, [
    path.join(backend, "node_modules/prisma/build/index.js"),
    ...args,
  ]);
const task = process.argv[2] || "serve";
if (task === "init") {
  if (!fs.existsSync(path.join(data, "PG_VERSION"))) {
    const passwordFile = path.join(local, "init-password");
    fs.writeFileSync(passwordFile, config.password, { mode: 0o600 });
    try {
      pg("initdb", [
        "-D",
        data,
        "-U",
        "joseph_local",
        "--pwfile",
        passwordFile,
        "--auth=scram-sha-256",
        "--encoding=UTF8",
        "--locale=C",
      ]);
    } finally {
      fs.unlinkSync(passwordFile);
    }
  }
  try {
    execFileSync(path.join(pgBin, "pg_ctl.exe"), ["-D", data, "status"], {
      stdio: "ignore",
      windowsHide: true,
    });
  } catch {
    pg("pg_ctl", [
      "-D",
      data,
      "-l",
      path.join(local, "postgres.log"),
      "-o",
      "-h 127.0.0.1 -p 55439",
      "-w",
      "start",
    ]);
  }
  prisma("migrate", "deploy");
} else if (task === "build") {
  prisma("generate");
  for (const name of [
    "errors",
    "messages",
    "jwt",
    "logger",
    "db",
    "repository",
  ])
    run(process.execPath, [
      path.join(backend, "node_modules/typescript/bin/tsc"),
      "-p",
      path.join(backend, "core", name, "tsconfig.json"),
    ]);
  run(process.execPath, [
    path.join(backend, "node_modules/typescript/bin/tsc"),
  ]);
} else if (task === "stop") {
  pg("pg_ctl", ["-D", data, "-m", "fast", "-w", "stop"]);
} else if (task === "serve") {
  const child = spawn(process.execPath, [path.join(backend, "dist/index.js")], {
    cwd: backend,
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
  child.on("exit", (code) => process.exit(code || 0));
} else if (task === "test") {
  env.JOSEPH_LOCAL_TEST = "true";
  env.NODE_ENV = "test";
  run(process.execPath, [
    path.join(backend, "node_modules/vitest/vitest.mjs"),
    "run",
    ...process.argv.slice(3),
  ]);
} else {
  throw new Error("Use init, build, serve, stop, or test");
}

// SR
