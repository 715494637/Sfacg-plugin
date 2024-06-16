import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
class SfacgBaseHttp {
    HOST = "https://api.sfacg.com";
    USER_AGENT_RSS = "SFReader/4.9.76 (iPhone; iOS 16.6; Scale/3.00)";
    USERNAME = "androiduser";
    PASSWORD = "1a#$51-yt69;*Acv@qxq";
    SALT = "FN_Q29XHVmfV3mYX"; // new Salt for Sfacg 5.0 Upper
    DEVICE_TOKEN: string | undefined;
    private cookie: string | undefined;
    constructor() {
        this.DEVICE_TOKEN = uuidv4().toUpperCase();
    }
    SetCookie(cookie: string) {
        this.cookie = cookie;
    }
    GetCookie() {
        return this.cookie;
    }

    private async md5(message) {
        // 使用Node.js的crypto模块来创建MD5哈希
        const hash = crypto.createHash("md5").update(message, "utf8").digest("hex");
        return hash.toUpperCase();
    }
    // private async md5(message: any) {
    // 	const msgUint8 = new TextEncoder().encode(message);
    // 	const hashBuffer = await crypto.subtle.digest("MD5", msgUint8);
    // 	const hashArray = Array.from(new Uint8Array(hashBuffer));
    // 	const hashHex = hashArray
    // 		.map((b) => b.toString(16).padStart(2, "0"))
    // 		.join("");
    // 	return hashHex.toUpperCase();
    // }
    async get<T, E = Record<string, any>>(url: string, query?: E): Promise<T> {
        const queryParams = new URLSearchParams(query as any).toString();
        const requestUrl = `${this.HOST}${url}${queryParams ? `?${queryParams}` : ""}`;
        const response = await fetch(requestUrl, {
            method: "GET",
            headers: {
                Authorization: `Basic ${btoa(`${this.USERNAME}:${this.PASSWORD}`)}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.sfacg.api+json;version=1",
                "Accept-Language": "zh-Hans-CN;q=1",
                "User-Agent": `boluobao/5.0.36(android;34)/H5/${this.DEVICE_TOKEN}/H5`,
                Cookie: this.cookie!,
                ...(query && { SFSecurity: await this.sfSecurity() }),
            },
        });

        const data = await response.json();
        return (data as any).data;
    }

    // 特定的 GET 请求 - 用于获取RSS数据
    async get_rss<E>(url: string): Promise<E> {
        const response = await fetch(`${this.HOST}${url}`, {
            method: "GET",
            headers: {
                "User-Agent": this.USER_AGENT_RSS,
                Accept: "image/webp,image/*,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh-Hans;q=0.9",
            },
        });
        const buffer = await response.arrayBuffer();
        return buffer as E;
    }

    async post<T, E = any>(url: string, data: E): Promise<any> {
        const response = await fetch(`${this.HOST}${url}`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${btoa(`${this.USERNAME}:${this.PASSWORD}`)}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.sfacg.api+json;version=1",
                "Accept-Language": "zh-Hans-CN;q=1",
                "User-Agent": `boluobao/5.0.36(android;34)/H5/${this.DEVICE_TOKEN}/H5`,
                Cookie: this.cookie!,
                SFSecurity: await this.sfSecurity(),
            },
            body: JSON.stringify(data),
        });
        const json = await response.json();
        return url.startsWith("/session") ? response : json;
    }

    async put<T, E = any>(url: string, data: E): Promise<T> {
        const response = await fetch(`${this.HOST}${url}`, {
            method: "PUT",
            headers: {
                Authorization: `Basic ${btoa(`${this.USERNAME}:${this.PASSWORD}`)}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.sfacg.api+json;version=1",
                "Accept-Language": "zh-Hans-CN;q=1",
                "User-Agent": `boluobao/5.0.36(android;34)/H5/${this.DEVICE_TOKEN}/H5`,
                Cookie: this.cookie!,
            },
            body: JSON.stringify(data),
        });
        const json = await response.json();
        return json as any;
    }

    private async sfSecurity(): Promise<string> {
        const uuid = uuidv4().toUpperCase();
        const timestamp = Math.floor(Date.now() / 1000);
        const data = `${uuid}${timestamp}${this.DEVICE_TOKEN}${this.SALT}`;
        const hash = await this.md5(data);
        return `nonce=${uuid}&timestamp=${timestamp}&devicetoken=${this.DEVICE_TOKEN}&sign=${hash}`;
    }
}
export { SfacgBaseHttp };
