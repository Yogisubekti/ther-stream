import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  BookOpen,
  ChevronRight,
  CircleHelp,
  Copyright,
  FileText,
  Flag,
  Loader2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Dukungan & Tentang — Mindcaster" },
      { name: "description", content: "Pusat dukungan, keamanan, panduan komunitas, dan kebijakan Mindcaster." },
      { property: "og:title", content: "Dukungan & Tentang — Mindcaster" },
      { property: "og:description", content: "Temukan bantuan, panduan keamanan, dan kebijakan Mindcaster." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell title="Dukungan">{(user) => <SupportPage userId={user.id} />}</AppShell>,
});

type Panel = "report" | "help" | "safety" | "community" | "terms" | "privacy" | "ip" | null;

const INFO: Record<Exclude<Panel, "report" | null>, { title: string; description: string; body: ReactNode }> = {
  help: {
    title: "Pusat Bantuan",
    description: "Jawaban cepat untuk menggunakan Mindcaster.",
    body: (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="post"><AccordionTrigger>Bagaimana cara membuat postingan?</AccordionTrigger><AccordionContent className="text-muted-foreground">Tulis ide Anda di Home, tambahkan foto bila perlu, lalu pilih Post. Setiap postingan dibatasi 500 karakter.</AccordionContent></AccordionItem>
        <AccordionItem value="wallet"><AccordionTrigger>Bagaimana menghubungkan dompet?</AccordionTrigger><AccordionContent className="text-muted-foreground">Buka Profil, pilih Hubungkan Dompet, lalu tanda tangani pesan verifikasi. Mindcaster tidak pernah meminta seed phrase.</AccordionContent></AccordionItem>
        <AccordionItem value="verify"><AccordionTrigger>Bagaimana mendapatkan centang biru?</AccordionTrigger><AccordionContent className="text-muted-foreground">Buka Verifikasi Akun dari menu Home, pilih paket dan jaringan, lalu selesaikan pembayaran melalui dompet yang terhubung.</AccordionContent></AccordionItem>
        <AccordionItem value="story"><AccordionTrigger>Berapa lama story tersedia?</AccordionTrigger><AccordionContent className="text-muted-foreground">Story foto atau video tersedia selama 24 jam dan dapat dihapus lebih awal oleh pemiliknya.</AccordionContent></AccordionItem>
      </Accordion>
    ),
  },
  safety: {
    title: "Pusat Keamanan",
    description: "Lindungi akun dan aset digital Anda.",
    body: <InfoBody items={["Jangan pernah membagikan kata sandi, private key, atau seed phrase.", "Periksa alamat dompet, jaringan, token, dan nominal sebelum menyetujui transaksi.", "Akses Mindcaster hanya dari alamat resmi dan waspadai tautan yang meminta data rahasia.", "Laporkan akun, postingan, atau aktivitas mencurigakan melalui fitur laporan."]} />,
  },
  community: {
    title: "Panduan Komunitas",
    description: "Ruang onchain yang sehat dimulai dari kita.",
    body: <InfoBody items={["Hormati pengguna lain dan perbedaan pendapat.", "Dilarang melakukan pelecehan, ancaman, spam, penipuan, atau manipulasi.", "Jangan membagikan data pribadi orang lain tanpa izin.", "Konten harus mematuhi hukum dan tidak melanggar hak pihak lain."]} />,
  },
  terms: {
    title: "Ketentuan Layanan",
    description: "Ketentuan utama penggunaan Mindcaster.",
    body: <InfoBody items={["Anda bertanggung jawab atas konten, akun, dan aktivitas dompet Anda.", "Mindcaster dapat membatasi konten atau akun yang melanggar panduan komunitas.", "Informasi onchain bukan nasihat keuangan; keputusan transaksi tetap menjadi tanggung jawab pengguna.", "Layanan dapat berubah untuk meningkatkan keamanan dan pengalaman pengguna."]} />,
  },
  privacy: {
    title: "Kebijakan Privasi",
    description: "Cara Mindcaster menangani informasi Anda.",
    body: <InfoBody items={["Data akun digunakan untuk menyediakan login, profil, interaksi sosial, dan dukungan.", "Bookmark, pesan, laporan, dan data pribadi dilindungi agar hanya dapat diakses sesuai kewenangan.", "Alamat dompet dan aktivitas blockchain bersifat publik setelah dicatat di jaringan.", "Mindcaster tidak menjual kata sandi, private key, atau data rahasia dompet Anda."]} />,
  },
  ip: {
    title: "Kebijakan Kekayaan Intelektual",
    description: "Menghormati karya dan kepemilikan digital.",
    body: <InfoBody items={["Unggah hanya konten yang Anda miliki atau berhak Anda gunakan.", "Atribusikan karya pihak lain bila lisensinya mensyaratkan.", "Pemilik hak dapat melaporkan dugaan pelanggaran melalui Laporkan Masalah.", "Mindcaster dapat membatasi konten yang terbukti melanggar hak cipta atau merek."]} />,
  },
};

function InfoBody({ items }: { items: string[] }) {
  return <ul className="space-y-3 text-sm leading-relaxed text-foreground/80">{items.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}</ul>;
}

function SupportPage({ userId }: { userId: string }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [category, setCategory] = useState("bug");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const supportItems = [
    { id: "report" as const, icon: Flag, title: "Laporkan Masalah", note: "Bug, akun, atau transaksi" },
    { id: "help" as const, icon: CircleHelp, title: "Pusat Bantuan", note: "Jawaban dan panduan penggunaan" },
    { id: "safety" as const, icon: ShieldCheck, title: "Pusat Keamanan", note: "Jaga akun dan dompet Anda" },
  ];
  const aboutItems = [
    { id: "community" as const, icon: UsersRound, title: "Panduan Komunitas" },
    { id: "terms" as const, icon: BookOpen, title: "Ketentuan Layanan" },
    { id: "privacy" as const, icon: FileText, title: "Kebijakan Privasi" },
    { id: "ip" as const, icon: Copyright, title: "Kebijakan Kekayaan Intelektual" },
  ];

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("support_reports").insert({ user_id: userId, category, subject: subject.trim(), description: description.trim() });
    setBusy(false);
    if (error) { toast.error("Laporan belum dapat dikirim. Coba lagi."); return; }
    setSubject(""); setDescription(""); setCategory("bug"); setPanel(null);
    toast.success("Laporan berhasil dikirim.");
  }

  const selected = panel && panel !== "report" ? INFO[panel] : null;

  return (
    <>
      <section aria-labelledby="about-mindcaster" className="rounded-2xl border border-border/70 bg-surface/80 p-5">
        <p className="text-[11px] font-bold uppercase text-muted-foreground">Tentang Mindcaster</p>
        <h2 id="about-mindcaster" className="mt-1 text-lg font-bold text-foreground">Where Ideas Become Onchain</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">Mindcaster adalah platform media sosial terdesentralisasi (Web3) yang menghubungkan diskusi komunitas kripto dengan data onchain secara langsung. Menggabungkan pengalaman microblogging modern dengan kekuatan ekosistem Web3, Mindcaster memungkinkan pengguna untuk:</p>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-foreground/80">
          <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /><span><b className="text-foreground">Berbagi Ide & Cerita:</b> mengunggah pemikiran, diskusi feed, serta foto/video melalui Story 24 jam.</span></li>
          <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /><span><b className="text-foreground">Sinyal Pasar & Alpha (FOMO Hub):</b> memantau sinyal beli/jual real-time, tesis trader terkurasi, dan leaderboard PnL mingguan.</span></li>
          <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /><span><b className="text-foreground">Identitas & Verifikasi Onchain:</b> menautkan dompet kripto serta memperoleh centang biru dan Badge OG melalui pembayaran di Base, Polygon, dan BNB Chain.</span></li>
        </ul>
      </section>

      <section aria-labelledby="support-heading">
        <p id="support-heading" className="mb-2 px-2 text-[11px] font-bold uppercase text-muted-foreground">Dukungan</p>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface/80">
          {supportItems.map(({ id, icon: Icon, title, note }, index) => (
            <Button key={id} type="button" variant="ghost" onClick={() => setPanel(id)} className={`h-auto w-full justify-start rounded-none px-4 py-3.5 text-left ${index ? "border-t border-border/70" : ""}`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-link"><Icon className="size-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{title}</span><span className="block truncate text-xs font-normal text-muted-foreground">{note}</span></span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Button>
          ))}
        </div>
      </section>

      <section aria-labelledby="about-heading">
        <p id="about-heading" className="mb-2 px-2 text-[11px] font-bold uppercase text-muted-foreground">Tentang</p>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface/80">
          {aboutItems.map(({ id, icon: Icon, title }, index) => (
            <Button key={id} type="button" variant="ghost" onClick={() => setPanel(id)} className={`h-auto w-full justify-start rounded-none px-4 py-4 text-left ${index ? "border-t border-border/70" : ""}`}>
              <Icon className="size-5 shrink-0 text-link" /><span className="flex-1 text-sm font-semibold text-foreground">{title}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Button>
          ))}
        </div>
      </section>

      <p className="py-2 text-center text-[11px] text-muted-foreground">Mindcaster · Where Ideas Become Onchain</p>

      <Dialog open={panel === "report"} onOpenChange={(open) => !open && setPanel(null)}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
          <form onSubmit={submitReport} className="space-y-4">
            <DialogHeader><DialogTitle>Laporkan Masalah</DialogTitle><DialogDescription>Ceritakan masalah yang Anda temui. Laporan hanya terlihat oleh Anda dan tim Mindcaster.</DialogDescription></DialogHeader>
            <label className="block text-xs font-semibold text-foreground/70">Jenis masalah<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"><option value="bug">Bug aplikasi</option><option value="account">Akun</option><option value="transaction">Transaksi</option><option value="other">Lainnya</option></select></label>
            <label className="block text-xs font-semibold text-foreground/70">Judul<input required minLength={3} maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-normal text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25" placeholder="Ringkasan masalah" /></label>
            <label className="block text-xs font-semibold text-foreground/70">Detail<textarea required minLength={10} maxLength={2000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 w-full resize-none rounded-xl border border-border bg-surface p-3 text-sm font-normal text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25" placeholder="Apa yang terjadi dan kapan?" /></label>
            <DialogFooter className="flex-row justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setPanel(null)}>Batal</Button><Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}Kirim laporan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setPanel(null)}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
          {selected && <><DialogHeader><DialogTitle>{selected.title}</DialogTitle><DialogDescription>{selected.description}</DialogDescription></DialogHeader>{selected.body}</>}
        </DialogContent>
      </Dialog>
    </>
  );
}