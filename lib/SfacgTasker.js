import { SfacgAPI } from "./SfacgAPI";
class SfacgTasker {
    Sfacg;
    userName;
    passWord;
    accountId;
    constructor(cookie, userName, passWord, accountId) {
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
            }
            catch (e) {
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
