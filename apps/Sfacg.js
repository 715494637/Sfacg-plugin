import plugin from "../../../lib/plugins/plugin.js";
import { SfacgAPI } from "../lib/SfacgAPI.js";
import { SfacgDownloader } from "../lib/SfacgDownload.js";
import { SfacgRegister } from "../lib/SfacgRegist.js";
import Common from "../../../lib/common/common.js";
import { Gfs } from "icqq";

/**
 *  novelInfo[]
 */
let Options = [];
let BookMap = new Map();
let AlbumMap = new Map();
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
                    reg: "^SF创号(\\d+)",
                    /** 执行方法 */
                    fnc: "Regist",
                },
                {
                    /** 命令正则匹配 */
                    reg: "(.*)---(.*)",
                    /** 执行方法 */
                    fnc: "Login",
                },
                {
                    /** 命令正则匹配 */
                    reg: "^提有声(.*)",
                    /** 执行方法 */
                    fnc: "PublishAlubum",
                },
            ],
        });
    }

    async delRedis() {
        await redis.del(`Yunzai:Sfacg:cookie:${this.e.user_id}`);
        this.reply("SF账号缓存已删除");
    }
    async UploadBook(id) {
        const downloader = new SfacgDownloader(id, this.e.nickname, await this.isLogin());
        try {
            const txt = await downloader.TxtMake();
            const gfs = new Gfs(this.e.bot, this.e.group_id);
            await gfs.upload(Buffer.from(txt.data), undefined, `${txt.novelName}.txt`);
        } catch (e) {
            await redis.del(`Yunzai:Sfacg:cookie:${this.e.user_id}`);
            this.reply("SF上传失败\n" + JSON.stringify(e));
        }
    }

    async isLogin() {
        const UserSf = await redis.get(`Yunzai:Sfacg:cookie:${this.e.user_id}`);
        if (!UserSf) {
            this.reply(`当前状态：未登录\n\n可【私聊发送】"账号---密码"登录`);
        } else {
            this.reply(`当前状态：已登录\n\n可提取【已购买】章节`);
        }
        return UserSf;
    }

    async Login() {
        if (this.e.group_id) {
            return;
        }
        let Sfcookie;
        const m = this.e.msg.match(new RegExp("(.*)---(.*)"));
        const u = m[1];
        const p = m[2];
        console.log(u, p);
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
        } catch (e) {
            await redis.del(`Yunzai:Sfacg:cookie:${this.e.user_id}`);
            this.reply("SF登录失败\n" + JSON.stringify(e));
        }
    }

    async PublishAlubum() {
        const n = this.e.msg.match(new RegExp("^提有声(.*)"))[1];
        if (!n) {
            return this.reply(`请发送：提有声"有声书名称"`);
        }
        const b = await this.noCookie.SearchAlbum(n);
        if (b.length === 0) {
            return this.reply("未搜到有声书");
        }
        AlbumMap.set(this.e.user_id, b);
        this.reply(
            Common.makeForwardMsg(this.e, [
                "请发送序号",
                b.map((s, i) => `${i + 1}. ${s.name}`).join("\n"),
            ])
        );
        this.setContext("PublishAlubum_2", false);
    }

    PublishAlubum_2 = async () => {
        this.finish("PublishAlubum_2");
        let index = Number(this.e.msg) - 1;
        const albumArray = AlbumMap.get(this.e.user_id);
        if (!(index >= 0 && index < albumArray.length)) {
            this.reply("序号错误");
            return;
        }
        this.noCookie.SetCookie(await this.isLogin());
        const data = await this.noCookie.Getalbum(albumArray[index].albumId);
        let ob = {}; // 确保ob被初始化为一个空对象
        for (let i of data) {
            // 修正：使用正确的方式来引用volumeId
            if (!ob[i.volumeId]) {
                ob[i.volumeId] = [];
            }
            // 这里需要使用i.volumeId而不是直接使用未定义的volumeId
            ob[i.volumeId].push(`章节名称: ${i.chapterTitle}
是否VIP：${i.isVip ? "是" : "否"}
价格：${i.expand.originNeedFireMoney}
音频链接：${i.fileName}
`);
        }
        for (let key in ob) {
            this.reply(Common.makeForwardMsg(this.e, ob[key], `卷id：${key}`));
        }
    };

    async PublishBook() {
        const n = this.e.msg.match(new RegExp("^提书(.*)"))[1];
        if (!n) {
            return this.reply(`请发送：提书"小说名称"`);
        }
        const b = await this.noCookie.searchInfos(n);
        if (b.length === 0) {
            return this.reply("未搜到小说");
        }
        BookMap.set(this.e.user_id, b);
        this.reply(
            Common.makeForwardMsg(this.e, [
                "请发送序号",
                b.map((s, i) => `${i + 1}. ${s.novelName}---${s.authorName}`).join("\n"),
            ])
        );
        this.setContext("PublishBook_2", false);
    }

    PublishBook_2 = async () => {
        this.finish("PublishBook_2");
        let index = Number(this.e.msg) - 1;
        const bookArray = BookMap.get(this.e.user_id);
        if (!(index >= 0 && index < bookArray.length)) {
            this.reply("序号错误");
            return;
        }
        await this.UploadBook(bookArray[index].novelId);
    };

    //
    async InitVote() {
        const Sfacg = new SfacgAPI();
        Options = await Sfacg.novels(0);
        await this.reply(
            Common.makeForwardMsg(this.e, [
                "以下为投票内容\n请发送【投票+序号】\n如【投票1，2，3】",
                Options.map((i, index) => `${index + 1}. ${`${this.format(i, 0)}`}`).join("\n"),
                "以上均为5折后的价格",
            ])
        );
    }
    async endVote() {
        await this.reply(
            Common.makeForwardMsg(this.e, [
                "投票结果：",
                this.calculateVoteResult(),
                "以上均为5折后的价格",
            ])
        );
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
                repeat.push(Number(op));
            } else if (!(0 < Number(op) < Options.length)) {
                invalid.push(Number(op));
            } else {
                userOptionArray.push(Number(op));
                success.push(Number(op));
            }
        }
        voteResults.set(this.e.user_id, userOptionArray);
        return this.reply(
            Common.makeForwardMsg(this.e, [
                `${
                    success.length !== 0 && "投票成功\n"
                } 成功投票: ${success}\n无效投票: ${invalid}\n重复投票: ${repeat}`,
                this.calculateVoteResult(),
                "以上均为5折后的价格",
            ])
        );
    }

    async Regist() {
        const Register = new SfacgRegister();
        const a = await Register.Main(this.e.msg.match(new RegExp("^SF创号(\\d+)"))[1]);
        this.reply(JSON.stringify(a));
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
    //         await this.reply(await Commen.Common.makeForwardMsg(this.e, r));
    //     }
}
