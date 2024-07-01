import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
class S3 {
    s3;
    Bucket;
    constructor(s3, Bucket) {
        this.s3 = s3;
        this.Bucket = Bucket;
    }
    async list(folder) {
        const cmd = new ListObjectsV2Command({
            Bucket: this.Bucket,
            Prefix: `${folder}/`,
            MaxKeys: 1000,
        });
        let out;
        do {
            const tmp = await this.s3.send(cmd);
            if (out) {
                out.Contents = out.Contents?.concat(tmp.Contents ?? []);
            }
            else {
                out = tmp;
            }
            cmd.input.ContinuationToken = tmp.NextContinuationToken;
        } while (cmd.input.ContinuationToken);
        out.Contents = out.Contents?.filter((i) => i.Size !== 0);
        return out;
    }
    async download(path, signal) {
        return this.s3.send(new GetObjectCommand({
            Bucket: this.Bucket,
            Key: path,
        }), { abortSignal: signal });
    }
    async upload(path, body, signal) {
        return this.s3.send(new PutObjectCommand({
            Bucket: this.Bucket,
            Key: path,
            Body: body,
            ContentType: "application/json",
        }), { abortSignal: signal });
    }
    async listAll() {
        const cmd = new ListObjectsV2Command({
            Bucket: this.Bucket,
            Delimiter: "/",
            MaxKeys: 1000,
        });
        let out;
        do {
            const tmp = await this.s3.send(cmd);
            if (out) {
                out.CommonPrefixes = out.CommonPrefixes?.concat(tmp.CommonPrefixes ?? []);
            }
            else {
                out = tmp;
            }
            cmd.input.ContinuationToken = tmp.NextContinuationToken;
        } while (cmd.input.ContinuationToken);
        if (out.CommonPrefixes) {
            return out.CommonPrefixes.map((i) => parseInt(i.Prefix));
        }
        else {
            return [];
        }
    }
}
export { S3 };
