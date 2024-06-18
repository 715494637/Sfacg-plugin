import * as fs from "fs";
import * as YAML from "yaml";
const _path = process.cwd();
const _configPath = `${_path}/plugins/Sfacg-plugin/config.yaml`;
const SfacgConfig = YAML.parse(fs.readFileSync(_configPath, `utf-8`));
export { SfacgConfig };
