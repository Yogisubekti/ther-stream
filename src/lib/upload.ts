import { createUploadUrl } from "@/lib/media.functions";

const IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const VID = ["video/mp4", "video/webm", "video/quicktime"] as const;
type CT = (typeof IMG)[number] | (typeof VID)[number];

export async function uploadImage(file: File, kind: "avatar" | "post" | "story"): Promise<string> {
  const ok: readonly string[] = kind === "story" ? [...IMG, ...VID] : IMG;
  if (!ok.includes(file.type)) throw new Error(kind === "story" ? "Format harus JPG, PNG, WebP, GIF, MP4, WebM, atau MOV." : "Format harus JPG, PNG, WebP, atau GIF.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Ukuran maksimal 10 MB.");
  const { uploadUrl, publicUrl } = await createUploadUrl({ data: { kind, contentType: file.type as CT, size: file.size } });
  const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "content-type": file.type } });
  if (!res.ok) throw new Error("Unggah gagal. Coba lagi.");
  return publicUrl;
}
