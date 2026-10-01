import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" } as const;
export const MAX_UPLOAD = 10 * 1024 * 1024;

export const createUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      kind: z.enum(["avatar", "post"]),
      contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
      size: z.number().int().positive().max(MAX_UPLOAD),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const accountId = process.env["CLOUDFLARE_R2_ACCOUNT_ID"];
    const accessKeyId = process.env["CLOUDFLARE_R2_ACCESS_KEY_ID"];
    const secretAccessKey = process.env["CLOUDFLARE_R2_SECRET_ACCESS_KEY"];
    const bucket = process.env["CLOUDFLARE_R2_BUCKET_NAME"];
    const publicUrl = process.env["CLOUDFLARE_R2_PUBLIC_URL"];
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) throw new Error("Penyimpanan belum dikonfigurasi.");
    const { AwsClient } = await import("aws4fetch");
    const client = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
    const key = `${data.kind}s/${context.userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${TYPES[data.contentType]}`;
    const url = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`);
    url.searchParams.set("X-Amz-Expires", "300");
    const signed = await client.sign(new Request(url, { method: "PUT", headers: { "content-type": data.contentType } }), { aws: { signQuery: true } });
    return { uploadUrl: signed.url, publicUrl: `${publicUrl.replace(/\/$/, "")}/${key}` };
  });
