import plugin from "../../../lib/plugins/plugin.js";
import { SfacgAPI } from "../lib/SfacgAPI.js";
import { SfacgDownloader } from "../lib/SfacgDownload.js";
import { Gfs } from "icqq";

/**
 *  novelInfo[]
 */
let Options = [];
let BookMap = new Map();
let BookIDMap = new Map();
let voteResults = new Map();

export class Sfacgplugin extends plugin {
    noCookie = new SfacgAPI();
    constructor() {
        super({
            name: "Sfacg-plugin",
            dsc: "菠萝包轻小说插件",
            /** https://oicqjs.github.io/oicq/#events */
            event: "message",
            priority: 5000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: "^众筹投票$",
                    /** 执行方法 */
                    fnc: "InitVote",
                },
                {
                    /** 命令正则匹配 */
                    reg: "^投票(.*)",
                    /** 执行方法 */
                    fnc: "vote",
                },
                {
                    /** 命令正则匹配 */
                    reg: "^结束投票",
                    /** 执行方法 */
                    fnc: "endVote",
                },
                {
                    /** 命令正则匹配 */
                    reg: "^群文件",
                    /** 执行方法 */
                    fnc: "files",
                },
                {
                    /** 命令正则匹配 */
                    reg: "^提书(.*)",
                    /** 执行方法 */
                    fnc: "PublishBook",
                },
                {
                    /** 命令正则匹配 */
                    reg: "^删除缓存",
                    /** 执行方法 */
                    fnc: "delRedis",
                },
                {
                    /** 命令正则匹配 */
                    reg: "^SF创号",
                    /** 执行方法 */
                    fnc: "Regist",
                },
            ],
        });
    }

    async delRedis() {
        await redis.del(`Yunzai:Sfacg:cookie:${this.e.user_id}`);
        this.reply("SF账号缓存已删除");
    }
    async UploadBook(id, Sfcookie) {
        const downloader = new SfacgDownloader(id, this.e.nickname, Sfcookie);
        try {
            const txt = await downloader.TxtMake();
            const gfs = new Gfs(this.e.bot, 965588349);
            await gfs.upload(Buffer.from(txt.data), undefined, `${txt.novelName}.txt`);
        } catch (e) {
            await redis.del(`Yunzai:Sfacg:cookie:${this.e.user_id}`);
            this.reply("SF上传失败\n" + e);
        }
    }

    GetAccount = async () => {
        if (this.e.group_id) {
            return;
        }
        let Sfcookie;
        this.finish("GetAccount");
        let accArray = this.e.msg.split("---");
        if (accArray.length !== 2) {
            this.reply("SF账号格式错误");
            return;
        }
        const u = accArray[0];
        const p = accArray[1];
        const Sfacg = new SfacgAPI();
        try {
            if (u === "cookie") {
                Sfcookie = p;
                await redis.set(`Yunzai:Sfacg:cookie:${this.e.user_id}`, p);
            } else {
                Sfcookie = await Sfacg.login(u, p);
                await redis.set(`Yunzai:Sfacg:cookie:${this.e.user_id}`, Sfcookie);
                this.reply("SF登录成功");
            }
            await this.UploadBook(BookIDMap.get(this.e.user_id).novelId, Sfcookie);
        } catch (e) {
            await redis.del(`Yunzai:Sfacg:cookie:${this.e.user_id}`);
            this.reply("SF登录失败\n" + e);
        }
    };

    GetBookId = async () => {
        this.finish("GetBookId");
        let index = Number(this.e.msg) - 1;
        if (!(index >= 0 && index < BookMap.get(this.e.user_id).length)) {
            this.reply("序号错误");
            return;
        }
        BookIDMap.set(this.e.user_id, BookMap.get(this.e.user_id)[index]);
        const UserSf = await redis.get(`Yunzai:Sfacg:cookie:${this.e.user_id}`);
        if (UserSf) {
            await this.UploadBook(BookIDMap.get(this.e.user_id).novelId, UserSf);
            this.reply(`已有账号凭证缓存，本次无需登录\n若要更换账号请发送"删除缓存"`);
        } else {
            this.setContext("GetAccount", false);
            this.reply(
                `请【私聊发送】SF账号|Sfcookie\n格式如：\n"12345678---abc1234"\n"cookie---xxx"`,
                true
            );
            this.reply("---");
        }
    };
    async PublishBook() {
        const n = this.e.msg.match(new RegExp("^提书(.*)"))[1];
        if (!n) {
            return this.reply(`请发送提书"小说名称"`);
        }
        const b = await this.noCookie.searchInfos(n);
        if (b.length === 0) {
            return this.reply("未搜到小说");
        }
        BookMap.set(this.e.user_id, b);
        this.reply(b.map((s, i) => `${i + 1}. ${s.novelName}---${s.authorName}`).join("\n"));
        this.setContext("GetBookId", false);
        this.reply("请发送序号");
    }
    //
    async InitVote() {
        const Sfacg = new SfacgAPI();
        Options = await Sfacg.novels(0);
        await this.reply(
            "请发送要投票的序号\n" +
                Options.map((i, index) => `${index + 1}. ${`${this.format(i, 0)}`}`).join("\n") +
                "\n以上均为5折后的价格",
            false
        );
    }
    async endVote() {
        await this.reply("已结束投票，投票结果为\n" + this.calculateVoteResult());
        Options = [];
        voteResults.clear();
    }
    async vote() {
        let success = [],
            invalid = [],
            repeat = [];
        let userOptionArray = voteResults.get(this.e.user_id) ?? [];
        let matchArray = this.e.msg
            .match(new RegExp("^投票(.*)"))[1]
            .split(new RegExp("(,|，)"))
            .map((item) => item.trim())
            .filter((item) => item !== "" && !isNaN(item));

        if (Options.length === 0) {
            return this.reply("投票内容未初始化");
        }

        for (let op of matchArray) {
            if (userOptionArray.includes(Number(op))) {
                repeat += Number(op);
            } else if (!(0 < Number(op) < Options.length)) {
                invalid += Number(op);
            } else {
                userOptionArray.push(Number(op));
                success.push(Number(op));
            }
        }
        voteResults.set(this.e.user_id, userOptionArray);
        this.reply(`投票成功\n成功投票: ${success}\n无效投票: ${invalid}\n重复投票: ${repeat}`);
        return this.reply(this.calculateVoteResult());
    }

    async Regist() {
        const Sfacg = new SfacgAPI();
    }

    format = (info, count) => {
        return `${info.novelName}--${info.expand.sysTags.map((t) => t.tagName).join(",")}--${
            info.charCount
        }字--${count === 0 ? "全本" : "均分"}${(
            (info.expand.totalNeedFireMoney * 0.005) /
            (count === 0 ? 1 : count)
        ).toFixed(2)}🍚`;
    };

    calculateVoteResult() {
        let counts = Array(Options.length).fill(0);
        for (let arr of voteResults.values()) {
            for (let index of arr) {
                counts[index - 1]++;
            }
        }
        return (
            counts
                .map(
                    (count, index) =>
                        `${index + 1}. ${this.format(Options[index], count)}: ${count}票`
                )
                .join("\n") + "\n以上均为5折后的价格"
        );
    }

    // async files() {
    //         const chineseDescriptions = (file) => {
    //             const createTime = new Date(file.create_time * 1000).toLocaleString();
    //             const modifyTime = new Date(file.modify_time * 1000).toLocaleString();
    //             return `fid: ${file.fid}
    // pid: ${file.pid}
    // 文件名: ${file.name}
    // 存储类型ID: ${file.busid}
    // 文件大小: ${file.size}字节
    // MD5: ${file.md5}
    // SHA1: ${file.sha1}
    // 创建时间: ${createTime}
    // 修改时间: ${modifyTime}
    // 用户ID: ${file.user_id}
    // 下载次数: ${file.download_times}
    // 是否是文件夹: ${file.is_dir ? "是" : "否"}`;
    //         };
    //         const gfs = new Gfs(this.e.bot, this.e.group_id);
    //         const files = await gfs.dir();
    //         const r = files.map((f) => chineseDescriptions(f));
    //         await this.reply(await Commen.makeForwardMsg(this.e, r));
    //     }
}
