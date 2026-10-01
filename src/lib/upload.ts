import { createUploadUrl } from "@/lib/media.functions";

const OK = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export async function uploadImage(file: File, kind: "avatar" | "post"): Promise<string> {
  if (!OK.includes(file.type as (typeof OK)[number])) throw new Error("Format harus JPG, PNG, WebP, atau GIF.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Ukuran maksimal 10 MB.");
  const { uploadUrl, publicUrl } = await createUploadUrl({ data: { kind, contentType: file.type as (typeof OK)[number], size: file.size } });
  const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "content-type": file.type } });
  if (!res.ok) throw new Error("Unggah gambar gagal. Coba lagi.");
  return publicUrl;
}
