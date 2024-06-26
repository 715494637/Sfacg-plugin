import { Group } from "icqq";
import { SfacgAPI } from "../lib/SfacgAPI.js";

export class GroupSync extends plugin {
    noCookie = new SfacgAPI();

    constructor() {
        super({
            name: "群管",
            dsc: "群管插件",
            /** https://oicqjs.github.io/oicq/#events */
            event: "message",
            priority: 5000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: "^#头衔$",
                    /** 执行方法 */
                    fnc: "SetTitle",
                },
            ],
        });
    }

    async SetTitle() {
        const g = new Group(Bot, this.e.group_id);
        g.SetTitle();
    }
}
