import { SfacgConfig } from "../utils/config";

class SmsService {
    private host: string;
    private u: string;
    private p: string;
    private tk: string;
    private sid: number;
    private phone: string;

    constructor() {
        this.sid = sid.Sfacg;
        this.host = "https://api.haozhuma.com";
        this.u = SfacgConfig.SMS_USERNAME;
        this.p = SfacgConfig.SMS_PASSWORD;
    }

    async getToken() {
        const res = await fetch("https://h5.haozhuma.com/login.php", {
            method: "POST",
            headers: {},
            body: JSON.stringify({
                username: this.u,
                password: this.p,
            }),
        });
        return (this.tk = (await res.json()).data.token);
    }

    async getPhone(action: "getPhone" | "cancelRecv" = "getPhone") {
        const res = await fetch(`${this.host}/sms`, {
            method: "POST",
            headers: {},
            body: JSON.stringify({
                api: action,
                token: this.tk,
                sid: this.sid,
                Province: "",
                ascription: "",
            }),
        });
        return (this.phone = (await res.json()).data.phone);
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
            headers: {},
        });
        return (await res.json()).data.yzm;
    }
}

enum sid {
    Sfacg = 50896,
    Ciweimao = 22439,
}

export { SmsService };
