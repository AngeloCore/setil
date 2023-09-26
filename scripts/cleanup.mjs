import { remove } from "fs-extra";
import { resolve } from "path";

const paths = [resolve("testOutput"), resolve("lib"), resolve("types")];

for (const p of paths) await remove(p);
