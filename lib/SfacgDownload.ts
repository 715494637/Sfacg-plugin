// deno-lint-ignore-file
import {
    Batche,
    chapter,
    DownLoadInit,
    JsonBook,
    JsonChapter,
    JsonHead,
    JsonVolume,
    VolumeList,
} from "./SfacgInterface";
import { createRetry } from "./SfacgTool";
import { SfacgAPI } from "./SfacgAPI";
import { JsonToTxt } from "./JsonTransformer";

export class SfacgDownloader {
    // protected DB: DataBaseAPI;
    protected init: DownLoadInit;
    protected Sfacg: SfacgAPI;
    protected NoCookie: SfacgAPI;
    protected novelId: number;
    protected publisher: string;
    protected JsonHead?: JsonHead;
    protected JsonVolume: JsonVolume[] = [];
    protected Volume: VolumeList[] = [];

    constructor(novelId: number, publisher: string = "Op要喝Op果奶", Sfcookie?: string) {
        this.init = {
            novelId,
            publisher,
            Sfcookie,
        };
        this.novelId = novelId;
        this.publisher = publisher;
        // this.DB = new DataBaseAPI();
        this.Sfacg = new SfacgAPI();
        this.NoCookie = new SfacgAPI();
        this.Sfacg.SetCookie(Sfcookie!);
    }
    // sleep = (t: number | undefined) => new Promise((r) => setTimeout(r, t));
    // pushtask = <T>(func: () => Promise<T>, tag: string) => (
    // )

    protected DownLoadFree(c: chapter | Batche) {
        return createRetry(() => this.NoCookie.contentInfos(c.chapId))();
    }
    protected DownLoadUserVip(c: chapter | Batche) {
        return createRetry(() => this.Sfacg.contentInfos(c.chapId))();
    }
    protected DownLoadDataBase(c: chapter | Batche) {}

    protected async GetNovelInfo() {
        const r = await this.NoCookie.novelInfo(this.novelId);
        this.JsonHead = {
            title: r.novelName,
            author: r.authorName,
            publisher: this.publisher,
            cover: r.novelCover,
            css: "",
            intro: r.expand?.intro,
        } as JsonHead;
    }

    protected async GetVolume() {
        this.Volume = (await this.Sfacg.VolumeList(this.novelId)) as VolumeList[];
    }

    protected async DownLoad() {
        for (let v of this.Volume) {
            const p = v.chapterList.map(async (c) => {
                if (!c.isVip) {
                    const data = await this.DownLoadFree(c);
                    console.log("Free Download: " + c.ntitle);
                    return {
                        ctitle: c.ntitle,
                        data: data,
                    } as JsonChapter;
                } else if (c.title === "DatabaseDownLoad") {
                    const data = await this.DownLoadUserVip(c);
                    console.log("Database Vip Download: " + c.ntitle);
                    return {
                        ctitle: c.ntitle,
                        data: data,
                    } as JsonChapter;
                } else if (c.isVip && !c.needFireMoney) {
                    const data = await this.DownLoadUserVip(c);
                    console.log("User Vip Download: " + c.ntitle);
                    return {
                        ctitle: c.ntitle,
                        data: data,
                    } as JsonChapter;
                }
            });
            const chapters = await Promise.all(p);
            this.JsonVolume.push({
                vtitle: v.title,
                chapters: chapters.filter(Boolean),
            } as JsonVolume);
        }
    }

    async JsonMake() {
        await this.GetNovelInfo();
        await this.GetVolume();
        await this.DownLoad();
        return {
            ...this.JsonHead,
            ...{ content: this.JsonVolume },
        } as JsonBook;
    }

    async TxtMake() {
        const Json = await this.JsonMake();
        return {
            novelName: this.JsonHead?.title,
            data: JsonToTxt(Json),
        };
    }

    async EpubMake() {}
}

export class cf_SfacgDownloader extends SfacgDownloader {
    async cf_JsonMake() {
        await this.GetNovelInfo();
        await this.GetVolume();
        await this.cf_DownLoad();
        return {
            ...this.JsonHead,
            ...{ content: this.JsonVolume },
        } as JsonBook;
    }

    async cf_TxtMake() {
        const Json = await this.cf_JsonMake();
        return {
            novelName: this.JsonHead?.title,
            data: JsonToTxt(Json),
        };
    }

    private async cf_DownLoad(limit: number = 50): Promise<void> {
        const list = this.cf_RetrieveBatches();
        let p: any[] = [];
        for (let i = 0; i < list.length; i += limit) {
            p.push(
                fetch("https://handle.bibyui11.workers.dev/handle/DownLoad", {
                    method: "POST",
                    body: JSON.stringify({
                        init: this.init,
                        data: list.slice(i, i + limit),
                    }),
                })
            );
        }
        const r = await Promise.all(p);
        const bj = await Promise.all(r.map((res) => res.json()));
        const ba = bj.flatMap((result) => result);
        this.JsonVolume = this.cf_Batches_To_JsonVolume(ba as Batche[]);
    }
    private cf_Batches_To_JsonVolume(list: Batche[]): JsonVolume[] {
        const JV: Record<string, JsonVolume> = {};
        list.forEach((i) => {
            if (!JV[i.vtitle]) {
                JV[i.vtitle] = { vtitle: i.vtitle, chapters: [] };
            }
            JV[i.vtitle].chapters.push({ ctitle: i.ctitle, data: i.data });
        });
        return Object.values(JV);
    }

    private cf_RetrieveBatches() {
        return this.Volume.flatMap((v) =>
            v.chapterList.map((c) => ({
                vtitle: v.title,
                ctitle: c.ntitle,
                chapId: c.chapId,
                data: "",
                isVip: c.isVip,
                needFireMoney: c.needFireMoney,
            }))
        ) as Batche[];
    }

    async cf_Handle_DataGet(NoDataList: Batche[]) {
        const p = NoDataList.map(async (c) => {
            if (!c.isVip) {
                const data = await this.DownLoadFree(c);
                console.log("Free Download: " + c.ctitle);
                return {
                    ...c,
                    data: data,
                } as Batche;
            } else if (c.ctitle === "DatabaseDownLoad") {
                const data = await this.DownLoadUserVip(c);
                console.log("Database Vip Download: " + c.ctitle);
                return {
                    ...c,
                    data: data,
                } as Batche;
            } else if (c.isVip && !c.needFireMoney) {
                const data = await this.DownLoadUserVip(c);
                console.log("User Vip Download: " + c.ctitle);
                return {
                    ...c,
                    data: data,
                } as Batche;
            }
        });
        return (await Promise.all(p)).filter(Boolean) as Batche[];
    }
}
