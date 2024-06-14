import fs from "node:fs";

logger.info("**************************************");
logger.info("Sfacg-plugin加载中");

if (!global.segment) {
  try {
    global.segment = (await import("icqq")).segment;
  } catch (err) {
    global.segment = (await import("oicq")).segment;
  }
}

const files = fs
  .readdirSync("./plugins/Sfacg-plugin/apps")
  .filter((file) => file.endsWith(".js"));

let ret = [];

files.forEach((file) => {
  ret.push(import(`./apps/${file}`));
});

ret = await Promise.allSettled(ret);

let apps = {};
for (let i in files) {
  let name = files[i].replace(".js", "");
  if (ret[i].status !== "fulfilled") {
    logger.error(`载入插件错误：${logger.red(name)}`);
    logger.error(ret[i].reason);
    continue;
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]];
}
// 启动服务器
logger.info("Sfacg-plugin加载成功");
logger.info("**************************************");

export { apps };
