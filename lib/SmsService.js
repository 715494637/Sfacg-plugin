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
        const toUrlEncoded = (obj) => Object.keys(obj)
            .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]))
            .join("&");
        const res = await fetch("https://h5.haozhuma.com/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            body: toUrlEncoded({
                username: this.u,
                password: this.p,
            }),
        });
        return (this.tk = (await res.json()).token);
    }
    async getPhone(action = "getPhone") {
        const param = new URLSearchParams({
            api: action,
            token: this.tk,
            sid: this.sid.toString(),
            Province: "",
            ascription: "",
        });
        const res = await fetch(`${this.host}/sms${param ? `?${param}` : ""}`, {
            method: "GET",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
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
        const res = await fetch(`${this.host}/sms${param ? `?${param}` : ""}`, {
            method: "GET",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        });
        
        return (await res.json()).yzm;
    }
}
var sid;
(function (sid) {
    sid[sid["Sfacg"] = 50896] = "Sfacg";
    sid[sid["Ciweimao"] = 22439] = "Ciweimao";
})(sid || (sid = {}));
export { SmsService };
