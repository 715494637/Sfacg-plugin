import { SfacgBaseHttp } from "./SfacgBaseHttp.js";
import { decrypt, getNowFormatDate } from "./SfacgTool.js";
class SfacgAPI extends SfacgBaseHttp {
    /**
     * 用户登录
     * @param userName 账号
     * @param passWord 密码
     * @returns 登录成功状态
     */
    async login(userName, passWord) {
        const res = await this.post("/sessions", {
            userName: userName,
            passWord: passWord,
        });
        // 初始化一个数组来收集 Cookie
        let cookies = [];
        // 使用 forEach() 方法来迭代所有的 Set-Cookie 头
        res.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") {
                // 只取出 Cookie 的名字和值
                cookies.push(value.split(";")[0]);
            }
        });
        // 将数组转换为字符串，并以分号和空格分隔
        const cookie = cookies.join("; ");
        // 这里的 SetCookie 方法应该是您自定义的方法，用于设置内部的 Cookie 字符串
        this.SetCookie(cookie);
        return cookie;
    }
    /**模拟设备上报
     * 签到时，新号如果不加就会提示：您的账号存在安全风险
     * @param accountId 账户Id, 通过userInfo获取
     * @returns 设备上报状态
     */
    async androiddeviceinfos(accountId) {
        const res = await this.post("/user/androiddeviceinfos", {
            accountId: accountId,
            package: "com.sfacg",
            abi: "arm64-v8a",
            deviceId: this.DEVICE_TOKEN.toLowerCase(),
            version: "4.8.22",
            deviceToken: "7b2a42976f97d470",
        });
        return res.status.httpCode == 200;
    }
    /**
     * 用户个人信息
     * @returns 用户个人信息
     */
    async userInfo() {
        return await this.get("/user", {
            expand: "welfareCoin",
        });
    }
    /**
     * 用户余额信息
     * @returns 用户余额信息
     */
    async userMoney() {
        return await this.get("/user/money");
    }
    /**
     * 代币过期信息
     * @param page 页数
     * @param size 大小
     * @returns 代币过期信息
     */
    async expireInfo(page = 0, size = 50) {
        return await this.get("/user/coupons", {
            page: page,
            size: size,
        });
    }
    /**
     * 小说详情
     * @param novelId 小说ID
     * @returns 小说详情
     */
    async novelInfo(novelId) {
        return await this.get(`/novels/${novelId}`, {
            expand: "chapterCount,bigBgBanner,bigNovelCover,typeName,intro,fav,ticket,pointCount,sysTags,totalNeedFireMoney,latestchapter",
        });
    }
    /**
     * 作者相关信息
     * @param authorId 作者ID
     * @returns 作者相关信息
     */
    async authorInfo(authorId) {
        return await this.get("/authors", {
            authorId: authorId,
            expand: "youfollow,fansNum",
        });
    }
    /**
     * 作者作品集
     * @param authorId 作者ID
     * @returns 作者作品集
     */
    async authorBooks(authorId) {
        return await this.get(`/authors/${authorId}/novels`);
    }
    /**
     * 卷信息
     * @param novelId 小说ID
     * @returns 卷列表
     */
    async VolumeList(novelId) {
        const res = await this.get(`/novels/${novelId}/dirs`);
        return res.volumeList;
    }
    /**
     * 章节内容
     * @param chapId 章节ID
     * @returns 章节内容
     */
    async contentInfos(chapId) {
        const res = await this.get(`/Chaps/${chapId}`, {
            expand: "content",
        });
        return decrypt(res.expand.content);
    }
    /**
     * 生成EPUB时使用，url获取图片Buffer
     * @param url 图片Url
     * @returns 图片Buffer
     */
    async image(url) {
        const response = await this.get_rss(url);
        return new Uint8Array(response);
    }
    /**
     * 小说搜索信息
     * @param novelName 小说名称
     * @param page 页数
     * @param size 大小
     * @returns
     */
    async searchInfos(novelName, page = 0, size = 40) {
        const res = await this.get("/search/novels/result/new", {
            page: page,
            q: novelName,
            size: size,
            sort: "hot",
        });
        return res.novels;
    }
    /**
     * 用户书架小说列表
     * @returns 用户书架小说列表
     */
    async bookshelfInfos_Expand_novel() {
        const res = await this.get("/user/Pockets", {
            expand: "novels,albums,comics",
        });
        return res.flatMap((bookshelf) => bookshelf.expand && bookshelf.expand.novels ? bookshelf.expand.novels : []);
    }
    /**
     * 筛选分类信息
     * @returns 筛选分类信息
     */
    async typeInfo() {
        return await this.get("/noveltypes");
    }
    /**
     * 筛选标签信息
     * @returns 筛选标签信息
     */
    async tags() {
        const res = await this.get("/novels/0/sysTags");
        // 被删手动补
        res.push({
            sysTagId: 74,
            tagName: "百合",
        });
        return res;
    }
    /**
     * 小说分类主页
     * @param page 页数
     * @returns 小说分类主页
     */
    async novels(page, isfinish = "is") {
        return await this.get(`/novels/0/sysTags/novels`, {
            page: page,
            updatedays: "-1",
            size: "20",
            isfree: "both",
            charcountbegin: "0",
            systagids: "",
            sort: "bookmark",
            isfinish: isfinish,
            charcountend: "0",
            expand: "sysTags,totalNeedFireMoney",
        });
    }
    /**
     * 购买小说
     * @param novelId 小说ID
     * @param chapId 章节ID
     * @returns 购买状态
     */
    async orderChap(novelId, chapId) {
        const res = await this.post(`/novels/${novelId}/orderedchaps`, {
            orderType: "readOrder",
            orderAll: false,
            autoOrder: false,
            chapIds: chapId,
        });
        return res.status.httpCode == 201;
    }
    // TaskTime Below !
    //。。。(> . <)。。。
    /**
     * 广告次数信息
     * @returns 广告次数信息
     */
    async adBonusNum() {
        const res = await this.get(`user/tasks`, {
            taskCategory: 5,
            package: "com.sfacg",
            deviceToken: this.DEVICE_TOKEN,
            page: 0,
            size: 20,
        });
        return res[0];
    }
    /**
     * 广告观看奖励
     * @param id
     * @returns 获取奖励状态
     */
    async adBonus(id = 21) {
        const res = await this.put(`/user/tasks/${id}/advertisement?aid=43&deviceToken=${this.DEVICE_TOKEN}`, {
            num: "1",
        });
        await this.taskBonus(id);
        return res.status.httpCode == 200;
    }
    /**
     * 签到
     * @returns 签到状态
     */
    async newSign() {
        const res = await this.put("/user/newSignInfo", {
            signDate: getNowFormatDate(),
        });
        return res.status.httpCode == 200;
    }
    /**
     * 获取任务列表
     * @returns 任务列表
     */
    async getTasks() {
        return await this.get("/user/tasks", {
            taskCategory: 1,
            package: "com.sfacg",
            deviceToken: this.DEVICE_TOKEN,
            page: 0,
            size: 20,
        });
    }
    /**
     * 领取分配任务
     * @param id
     * @returns 领取分配任务状态
     */
    async claimTask(id) {
        const res = await this.post(`/user/tasks/${id}`, {});
        return res.status.httpCode == 201;
    }
    /**
     * 阅读时长
     * @param time 时间（min）
     * @returns 阅读时长提交状态
     */
    async readTime(time) {
        const res = await this.put("/user/readingtime", {
            seconds: time * 60,
            entityType: 2,
            chapterId: 477385,
            entityId: 368037,
            readingDate: getNowFormatDate(),
        });
        return res.status.httpCode == 200;
    }
    /**
     * 天天分享
     * @param accountID 账户ID
     * @returns 分享状态
     */
    async share(accountID) {
        const res = await this.put(`/user/tasks?taskId=4&userId=${accountID}`, {
            env: 0,
        });
        return res.status.httpCode == 200;
    }
    /**
     * 任务完成，领取奖励
     * @param id 任务ID
     * @returns 领奖状态
     */
    async taskBonus(id) {
        const res = await this.put(`/user/tasks/${id}`, {});
        return res.status.httpCode == 200;
    }
    /**
     * 新号关注奖励
     * @returns 领奖状态
     */
    async NewAccountFollowBonus() {
        const res = await this.post("/user/follows", {
            accountIds: "933648,974675,2793814,3527946,3553442,3824463,6749649,6809014,7371156,",
        });
        return res.status.httpCode == 201;
    }
    /**
     * 新号收藏奖励
     * @returns 领奖状态
     */
    async NewAccountFavBonus() {
        const res = await this.post("/pockets/-1/novels", {
            novelId: 591904,
            categoryId: 0,
        });
        return res.status.httpCode == 201;
    }
    /**
     * 金币兑换
     * @param id 兑换ID
     * @returns 兑换状态
     */
    async welfare(recordId = 26) {
        const res = await this.post(`/user/welfare/storeitemrecords/${recordId}`, {});
        return res.status.httpCode == 200;
    }
    // 注册机，启动！！！
    /**
     * 名称可用性检测
     * @param name
     * @returns 是否可用
     */
    async avalibleNmae(name) {
        const res = await this.post("/users/availablename", {
            nickName: name,
        });
        return res.data.nickName.valid;
    }
    /**
     * 发出验证码
     * @param phone 手机号
     * @returns 发出状态
     */
    async sendCode(phone) {
        const res = await this.post(`/sms/${phone}/86`, "");
        return res.status.httpCode == 201;
    }
    /**
     * 携带短信验证码验证
     * @param phone 手机号
     * @param smsAuthCode 验证码
     * @returns 验证状态
     */
    async codeverify(phone, smsAuthCode) {
        const res = await this.put(`/sms/${phone}/86`, {
            smsAuthCode: smsAuthCode,
        });
        return res.status.httpCode == 200;
    }
    /**
     * 注册！
     * @param passWord 密码
     * @param nickName 昵称
     * @param phone 手机号
     * @param smsAuthCode 验证码
     * @returns 验证状态
     */
    async regist(passWord, nickName, phone, smsAuthCode) {
        let res = await this.post("/user", {
            passWord: passWord,
            nickName: nickName,
            countryCode: "86",
            phoneNum: phone,
            email: "",
            smsAuthCode: smsAuthCode,
            shuMeiId: "",
        });
        console.log(res);
        return res.data.accountId;
    }
}
export { SfacgAPI };
// 单元测试
// (async () => {
//   const a = new SfacgAPI()
//   await a.login("13696458853", "dddd1111")
//   await a.orderChap(567122, [6981672, 6984421])
// const b = await a.expireInfo()
// fs.writeJSONSync("./TESTDATA/expireInfo.json",b)
// const acc = await a.userInfo()
// const id = acc && acc.accountId
// console.log(id);
// if (id) {
//   const info = await a.androiddeviceinfos(id)
//   console.log(info);
// }
// const b = await a.newSign()
// console.log(b);
// })();
