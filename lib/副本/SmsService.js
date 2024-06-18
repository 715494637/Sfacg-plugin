import { SfacgConfig } from "../utils/config.js";
class SmsService {
    host;
    u;
    p;
    tk;
    sid;
    phone;
    constructor() {
        this.sid = sid.Sfacg;
        this.host = "https://api.haozhuma.com";
        this.u = SfacgConfig.SMS_USERNAME;
        this.p = SfacgConfig.SMS_PASSWORD;
    }
    async getToken() {
        const res = await fetch("https://h5.haozhuma.com/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            body: this.toUrlEncoded({
                username: this.u,
                password: this.p,
            }),
        });
        return (this.tk = (await res.json()).token);
    }
    async getPhone(action = "getPhone") {
        const res = await fetch(`${this.host}/sms`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            body: this.toUrlEncoded({
                api: action,
                token: this.tk,
                sid: this.sid,
                Province: "",
                ascription: "",
            }),
        });
        return (this.phone = (await res.json()).phone);
    }
    async receive() {
        const param = new URLSearchParams({
            api: "getMessage",
            token: this.tk,
            sid: this.sid.toString(),
            phone: this.phone,
            tm: new Date().getTime().toString(),
        });
        const url = `${this.host}/sms${param ? `?${param}` : ""}`;
        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        });
        return (await res.json()).yzm;
    }
    toUrlEncoded(obj) {
        return Object.keys(obj)
            .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]))
            .join("&");
    }
}
var sid;
(function (sid) {
    sid[sid["Sfacg"] = 50896] = "Sfacg";
    sid[sid["Ciweimao"] = 22439] = "Ciweimao";
})(sid || (sid = {}));
export { SmsService };
