import * as fs from "fs";
import * as YAML from "yaml";
interface Config {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_KEY: string;
    SMS_USERNAME: string;
    SMS_PASSWORD: string;
    REGIST_PASSWORD: string;
}

const _path = process.cwd();
const _configPath = `${_path}/plugins/Sfacg-plugin/config.yaml`;
const SfacgConfig: Config = YAML.parse(fs.readFileSync(_configPath, `utf-8`));

export { SfacgConfig };
