import { SfacgAPI } from "./SfacgAPI";

class SfacgTasker {
    protected Sfacg: SfacgAPI;
    protected userName: string;
    protected passWord: string;
    protected accountId: string;

    constructor(cookie: string, userName: string, passWord: string, accountId: string) {
        this.Sfacg = new SfacgAPI();
        this.Sfacg.SetCookie(cookie);
        this.userName = userName;
        this.passWord = passWord;
        this.accountId = accountId;
    }

    async Dev() {
        return new Promise(async (r, j) => {
            try {
                r(await this.Sfacg.getTasks());
            } catch (e: any) {
                await this.Sfacg.login(this.userName, this.passWord)
                    .then(async (_) => {
                        r(await this.Sfacg.getTasks());
                    })
                    .catch((e) => {
                        j(e);
                    });
            }
        });
    }
}

export { SfacgTasker };
