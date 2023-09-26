import test from "node:test";
import assert from "node:assert";
import { resolve } from "node:path";
import { readFileSync, copy, writeFileSync } from "fs-extra";
import * as setil from "../src";
import { execSync } from "node:child_process";
import { Parse as PEParse } from "pe-parser";
import { signatureGet } from "portable-executable-signature";

const ext = process.platform === "win32" ? ".exe" : "";

test("Constants", () => {
  assert.deepStrictEqual(setil.Constants, {
    RESOURCE_NAME: "NODE_SEA_BLOB",
    SENTINEL_FUSE: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
    MACHO_SEGMENT_NAME: "NODE_SEA"
  });
});

test("basic", async () => {
  const input = readFileSync("test/projects/basic/index.js", "utf-8");
  const output = resolve(`testOutput/basic${ext}`);

  const compiled = await setil.compile(input, output, { disableSeaWarning: true });

  const data = execSync(`"${compiled.outputPath}"`)
    .toString("utf-8")
    .replace(/(\r\n|\n|\r)/gm, "");

  assert.strictEqual(data, "Basic example!");
});

test("custom Node.js exe", async (t) => {
  const nodeExePath = resolve("testOutput/customNodeExe.exe");
  await copy(process.execPath, nodeExePath);

  const input = readFileSync("test/projects/basic/index.js", "utf-8");
  const output = resolve(`testOutput/customExe${ext}`);

  const compiled = await setil.compile(input, output, {
    nodeExePath,
    disableSeaWarning: true
  });

  await t.test("Program Working", () => {
    const data = execSync(`"${compiled.outputPath}"`)
      .toString("utf-8")
      .replace(/(\r\n|\n|\r)/gm, "");

    assert.strictEqual(data, "Basic example!");
  });

  await t.test("Did use custom exe", () => {
    assert.strictEqual(compiled.nodeExePath, nodeExePath);
  });
});

test("custom Node.js exe (no exist)", async (t) => {
  const nodeExePath = resolve("lmao.exe");

  const input = readFileSync("test/projects/basic/index.js", "utf-8");
  const output = resolve(`testOutput/customExe${ext}`);

  const compiled = await setil.compile(input, output, {
    nodeExePath,
    disableSeaWarning: true,
    logLevel: "silent"
  });

  await t.test("Program Working", () => {
    const data = execSync(`"${compiled.outputPath}"`)
      .toString("utf-8")
      .replace(/(\r\n|\n|\r)/gm, "");

    assert.strictEqual(data, "Basic example!");
  });

  await t.test("Did use custom exe", () => {
    assert.strictEqual(compiled.nodeExePath, process.execPath);
  });
});

test("custom Node.js exe (corrupted)", async () => {
  const nodeExePath = resolve("testOutput/customExeCorrupted.exe");

  writeFileSync(nodeExePath, "test");

  const input = readFileSync("test/projects/basic/index.js", "utf-8");
  const output = resolve(`testOutput/customExe${ext}`);

  await assert.rejects(
    setil.compile(input, output, {
      nodeExePath,
      disableSeaWarning: true
    }),
    {
      message: "Offset is outside the bounds of the DataView"
    }
  );
});

test("custom Node.js exe (corrupted + signature)", async () => {
  const nodeExePath = resolve("testOutput/customExeCorrupted.exe");

  writeFileSync(nodeExePath, "test");

  const input = readFileSync("test/projects/basic/index.js", "utf-8");
  const output = resolve(`testOutput/customExe${ext}`);

  await assert.rejects(
    setil.compile(input, output, {
      nodeExePath,
      disableSeaWarning: true,
      noSign: false
    }),
    {
      message: "Executable must be a supported format: ELF, PE, or Mach-O"
    }
  );
});

test("NodeJS signature", async () => {
  const input = readFileSync("test/projects/basic/index.js", "utf-8");
  const output = resolve(`testOutput/withSign${ext}`);

  const compiled = await setil.compile(input, output, { disableSeaWarning: true, noSign: false });

  const buf = readFileSync(compiled.outputPath);

  const data = signatureGet(buf);

  assert.notStrictEqual(data, null, `Signature shouldn't be "null".`);
});

test("preInject hook", { skip: process.platform != "win32" }, async () => {
  const input = readFileSync("test/projects/basic/index.js", "utf-8");
  const output = resolve(`testOutput/preInject${ext}`);

  const nodeBuf = readFileSync(process.execPath);
  const nodeTimestamp = (await PEParse(nodeBuf)).nt_headers.FileHeader.TimeDateStamp;
  let compiledTimestamp;

  const preInject = async (path) => {
    const buf = readFileSync(path);
    const data = await PEParse(buf);
    compiledTimestamp = data.nt_headers.FileHeader.TimeDateStamp;
  };

  await setil.compile(input, output, { disableSeaWarning: true, preInject });

  assert.strictEqual(compiledTimestamp, nodeTimestamp);
});
