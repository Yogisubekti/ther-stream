import { supabase } from "@/integrations/supabase/client";

export type Author = { id: string; display_name: string | null; username: string | null; avatar_url: string | null; wallet_address: string | null } | null;
export type Comment = { id: string; content: string; created_at: string; author_id: string; author: Author };
export type Post = {
  id: string; content: string; image_url?: string | null; created_at: string; author_id: string; author: Author;
  post_likes: { user_id: string }[];
  post_reposts: { user_id: string }[];
  post_reactions: { user_id: string; emoji: string }[];
  post_bookmarks: { user_id: string }[];
  post_comments: Comment[];
};
export type Profile = {
  id: string; display_name: string | null; username: string | null; bio: string | null;
  avatar_url: string | null; wallet_address: string | null; created_at: string;
};

const AUTHOR = "id, display_name, username, avatar_url, wallet_address";
export const POST_SELECT = `id, content, image_url, created_at, author_id, author:profiles!posts_author_id_fkey(${AUTHOR}), post_likes(user_id), post_reposts(user_id), post_reactions(user_id, emoji), post_bookmarks(user_id), post_comments(id, content, created_at, author_id, author:profiles!post_comments_author_id_fkey(${AUTHOR}))`;

export const REACTIONS = ["🔥", "😂", "😮", "🚀", "👏"] as const;

export function normalize(data: unknown): Post[] {
  return ((data ?? []) as Post[]).map((p) => ({
    ...p,
    post_comments: [...p.post_comments].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }));
}

export async function fetchPosts(filter?: { ids?: string[]; authorId?: string }) {
  let q = supabase.from("posts").select(POST_SELECT).order("created_at", { ascending: false }).limit(50);
  if (filter?.authorId) q = q.eq("author_id", filter.authorId);
  if (filter?.ids) q = q.in("id", filter.ids.length ? filter.ids : ["00000000-0000-0000-0000-000000000000"]);
  const { data, error } = await q;
  if (error) throw error;
  return normalize(data);
}

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
export const displayName = (a: Author | Profile | null) => a?.display_name || a?.username || "Anonymous";
export const handle = (a: Author | Profile | null) => (a?.username ? `@${a.username}` : null);
export const joined = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

export function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}d`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}j`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export async function resizeImage(file: File, size = 192): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const min = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/jpeg", 0.82);
}
