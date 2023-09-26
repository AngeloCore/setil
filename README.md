## Setil - single executable applications utility

### ⚠️ SUPER EXPERIMENTAL

> The goal of this package is to help you build node.js [SEA](https://nodejs.org/api/single-executable-applications.html) with ease.

### CLI Example

CLI usage is not implemented yet.

### Code Example

```mjs
import { compile } from "setil";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const input = readFileSync("src/index.js", "utf-8");
const output = `./app.exe`;

await setil.compile(input, output);

// Enjoy!
```

### Usage

`compile(input: string, rawOutput: string, rawOptions?: Partial<Options>): Promise<Result>`

- input - Since SEA doesn't allow imports after compilation, you can use rollup to bundle your project into a single file. You can also check [rollup-plugin-jsative](https://github.com/AngeloCore/rollup-plugin-jsative) if you are using native modules.
- output (rawOutput) - The output path of your application, e.g. `./program.exe`.
- options (rawOptions) - Any additional customization, checkout [Options](#options)

#### **`Options`**

| Property            | Type                                  | Default             | Description                                                                                                                        |
| ------------------- | ------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `logLevel`          | [LogLevel](#loglevel)                 | "warn"              | Specifies the desired log level for the application.                                                                               |
| `disableSeaWarning` | boolean                               | false               | Disables `(node:16104) ExperimentalWarning: Single executable application is an experimental feature and might change at any time` |
| `useSnapshot`       | boolean                               | false               | [Startup Snapshots](https://nodejs.org/api/single-executable-applications.html#startup-snapshot-support)                           |
| `useCodeCache`      | boolean                               | false               | [V8 Code Cache](https://nodejs.org/api/single-executable-applications.html#v8-code-cache-support)                                  |
| `nodeExePath`       | string \| undefined                   | process.execPath    | The path where the blob should be injected into (Optional)                                                                         |
| `noSign`            | boolean                               | true                | Controls whether to remove the original Node.JS signature.                                                                         |
| `preInject`         | (path: string) => any \| Promise<any> | Noop (no operation) | A hook executed just before the blob is injected into the application can be used to modify the nodeExePath file.                  |

#### Types

#### **`Result`**

| Property      | Type   | Description                   |
| ------------- | ------ | ----------------------------- |
| `input`       | string | The input code used.          |
| `outputPath`  | string | The output path of the SEA.   |
| `nodeExePath` | string | The `nodeExePath` used.       |
| `tempDir`     | string | The temporary directory used. |

#### **`LogLevel`**

One of `debug`, `warn` or `silent`

- debug - Show debug logs
- warn - Show warnings only (default)
- silent - Don't print anything

### Resources

- [Github](https://github.com/AngeloCore/setil)
- [Node.js SEA](https://nodejs.org/api/single-executable-applications.html)
- [Rollup](https://rollupjs.org/v)
- [@rollup/plugin-commonjs](https://www.npmjs.com/package/@rollup/plugin-commonjs)
- [@rollup/plugin-node-resolve](https://www.npmjs.com/package/@rollup/plugin-node-resolve)
- [rollup-plugin-jsative](https://github.com/AngeloCore/rollup-plugin-jsative)
