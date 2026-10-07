import { createUploadUrl } from "@/lib/media.functions";

const IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const VID = ["video/mp4", "video/webm", "video/quicktime"] as const;
type CT = (typeof IMG)[number] | (typeof VID)[number];

export async function uploadImage(file: File, kind: "avatar" | "post" | "story"): Promise<string> {
  const ok: readonly string[] = kind === "story" ? [...IMG, ...VID] : IMG;
  if (!ok.includes(file.type)) throw new Error(kind === "story" ? "Format must be JPG, PNG, WebP, GIF, MP4, WebM, or MOV." : "Format must be JPG, PNG, WebP, or GIF.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Maximum size is 10 MB.");
  const { uploadUrl, publicUrl } = await createUploadUrl({ data: { kind, contentType: file.type as CT, size: file.size } });
  const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "content-type": file.type } });
  if (!res.ok) throw new Error("Upload failed. Please try again.");
  return publicUrl;
}
