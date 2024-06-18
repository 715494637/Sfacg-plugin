import { SfacgConfig } from "../utils/config.js";
class SmsService {
    host;
    u;
    p;
    tk;
    pid;
    phone;
    constructor() {
        this.pid = pid.Sfacg;
        this.host = "http://api.sqhyw.net:90/api";
        this.u = SfacgConfig.SMS_USERNAME;
        this.p = SfacgConfig.SMS_PASSWORD;
    }
    async getToken() {
        const param = new URLSearchParams({
            username: this.u,
            password: this.p,
        });
        const res = await fetch(`${this.host}/logins${param ? `?${param}` : ""}`);
        return (this.tk = (await res.json()).token);
    }
    async getPhone() {
        const param = new URLSearchParams({
            token: this.tk,
            project_id: this.pid.toString(),
        });
        const res = await fetch(`${this.host}/get_mobile${param ? `?${param}` : ""}`);
        return (this.phone = (await res.json()).mobile);
    }
    async freePhone() {
        const param = new URLSearchParams({
            token: this.tk,
            project_id: this.pid.toString(),
        });
        const res = await fetch(`${this.host}/free_mobile${param ? `?${param}` : ""}`);
        return "ok" === (await res.json()).message;
    }
    async receive() {
        const param = new URLSearchParams({
            token: this.tk,
            project_id: this.pid.toString(),
            phone_num: this.phone,
        });
        const res = await fetch(`${this.host}/get_message${param ? `?${param}` : ""}`);
        return (await res.json()).code;
    }
}
var pid;
(function (pid) {
    pid[pid["Sfacg"] = 17521] = "Sfacg";
    pid[pid["Ciweimao"] = 22439] = "Ciweimao";
    pid[pid["Ciyuanji"] = 79538] = "Ciyuanji";
})(pid || (pid = {}));
export { SmsService };
