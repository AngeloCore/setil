import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

import fs from "fs-extra";
import { merge } from "smob";
import * as PESign from "portable-executable-signature";
import postject from "postject";

import Logger, { LogLevel } from "./logger";

export interface Options {
  logLevel: LogLevel;
  disableSeaWarning: boolean;
  useSnapshot: boolean;
  useCodeCache: boolean;
  nodeExePath?: string;
  noSign: boolean;
  preInject: (path: string) => any | Promise<any>;
}

export interface Result {
  input: string;
  outputPath: string;
  nodeExePath: string;
  tempDir: string;
}

const defaultOptions: Options = {
  logLevel: "warn",
  disableSeaWarning: false,
  useSnapshot: false,
  useCodeCache: false,
  noSign: true,
  preInject: () => {}
};

export const Constants = {
  RESOURCE_NAME: "NODE_SEA_BLOB",
  SENTINEL_FUSE: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
  MACHO_SEGMENT_NAME: "NODE_SEA"
} as const;

export async function compile(input: string, rawOutput: string, rawOptions?: Partial<Options>): Promise<Result> {
  const options = merge(rawOptions || {}, defaultOptions);
  const logger = new Logger(options.logLevel);

  if (typeof rawOutput != "string")
    throw new TypeError(
      `The "rawOutput" argument must be of type string. Received type ${typeof rawOutput} (${rawOutput})`
    );

  const output = path.resolve(rawOutput);

  logger.debug(`Output set to "${output}"`);

  await fs.ensureFile(output);
  await fs.remove(output);

  const outDir = await makeTemp("setil-cache");

  logger.debug(`Working directory set to "${outDir}"`);

  const inputPath = path.join(outDir, "input.js");

  logger.debug(`Writing input file into "${inputPath}"`);

  await fs.writeFile(inputPath, input);

  const blobOutputPath = path.join(outDir, "sea.blob");

  const seaConfig = {
    main: inputPath,
    output: blobOutputPath,
    disableExperimentalSEAWarning: options.disableSeaWarning,
    useSnapshot: options.useSnapshot,
    useCodeCache: options.useCodeCache
  };

  const seaConfigPath = path.join(outDir, "config.json");

  logger.debug(`Writing SEA Config into "${seaConfigPath}"`);

  await fs.writeFile(seaConfigPath, JSON.stringify(seaConfig));

  logger.debug("Generating blob file");

  try {
    const command = `"${process.execPath}" --experimental-sea-config "${seaConfigPath}"`;

    logger.debug(`Running command: \`${command}\``);

    execSync(command, { stdio: "pipe" });
  } catch (e) {
    throw new Error("Failed building blob file: " + e);
  }

  const nodePath = filterPaths(options.nodeExePath, process.execPath) as string;

  if (options.nodeExePath && nodePath === process.execPath)
    logger.warn("Invalid nodeExePath option provided; falling back to process.execPath.");

  logger.debug(`Copying node.js executable from "${nodePath}" into "${output}"`);

  await fs.copy(nodePath, output);

  logger.debug("Reading blob file");

  const blob = await fs.readFile(blobOutputPath);

  if (options.noSign) {
    logger.debug("Reading node executable");
    const outbuf = await fs.readFile(output);

    logger.debug("Removing original NodeJS signature");
    const unsigned = PESign.signatureSet(outbuf, null);

    logger.debug("Writing unsigned file");
    await fs.writeFile(output, Buffer.from(unsigned));
  }

  logger.debug("Executing preInject hook");

  if (typeof options.preInject === "function") {
    logger.debug("Calling preInject hook");
    await options.preInject(output);
  }

  logger.debug("Injecting blob file into node executable");

  await postject.inject(output, Constants.RESOURCE_NAME, blob, {
    sentinelFuse: Constants.SENTINEL_FUSE,
    machoSegmentName: Constants.MACHO_SEGMENT_NAME
  });

  logger.debug("Cleaning up working directory");

  await fs.remove(outDir).catch(() => {});

  return {
    input,
    outputPath: output,
    nodeExePath: nodePath,
    tempDir: outDir
  };
}

function makeTemp(prefix?: string) {
  return fs.mkdtemp(tmpdir() + path.sep + (prefix ? prefix + "-" : ""));
}

function filterPaths(...paths: any[]) {
  for (const p of paths) {
    if (typeof p != "string") continue;

    const patty = path.resolve(p);
    if (!fs.pathExistsSync(patty)) continue;

    return p;
  }
}
