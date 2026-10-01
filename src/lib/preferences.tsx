import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type LanguagePreference = "auto" | "id" | "en";
export type ThemePreference = "system" | "light" | "dark";
export type Locale = "id" | "en";

const copy = {
  id: {
    home: "Beranda", discover: "Temukan", notifications: "Notifikasi", messages: "Pesan", profile: "Profil",
    follow: "Ikuti", following: "Mengikuti", language: "Bahasa", appearance: "Tampilan", automatic: "Otomatis",
    indonesian: "Bahasa Indonesia", english: "English", system: "Ikuti perangkat", light: "Terang", dark: "Gelap",
    groups: "Grup", createGroup: "Buat grup", verifyAccount: "Verifikasi akun", bookmarks: "Bookmark", soon: "SEGERA",
    whatsHappening: "Apa yang sedang terjadi?", post: "Post", noPosts: "Belum ada postingan. Mulai percakapan!",
    comments: "Komentar", repost: "Repost", likePost: "Suka postingan; tahan untuk pilihan reaksi", reactionChoices: "Pilihan reaksi",
    like: "Suka", removeBookmark: "Hapus bookmark", bookmark: "Bookmark", postMenu: "Menu postingan",
    editPost: "Edit postingan", deletePost: "Hapus postingan", report: "Laporkan", writeComment: "Tulis komentar…",
    reply: "Balas", deleteComment: "Hapus komentar", updatePost: "Perbarui isi postingan Anda.", cancel: "Batal", save: "Simpan",
    reportPost: "Laporkan postingan", reportPrivate: "Pilih alasan yang paling sesuai. Laporan Anda bersifat privat.",
    reason: "Alasan", sendReport: "Kirim laporan", spam: "Spam", harassment: "Pelecehan", misinformation: "Informasi menyesatkan",
    illegal: "Konten ilegal", other: "Lainnya", postUpdated: "Postingan diperbarui", postDeleted: "Postingan dihapus",
    bookmarkRemoved: "Bookmark dihapus", postSaved: "Postingan disimpan", reportSent: "Laporan terkirim",
    reportThanks: "Terima kasih telah membantu menjaga komunitas.", reactionFailed: "Gagal memberi reaksi.",
  },
  en: {
    home: "Home", discover: "Discover", notifications: "Notifications", messages: "Messages", profile: "Profile",
    follow: "Follow", following: "Following", language: "Language", appearance: "Appearance", automatic: "Automatic",
    indonesian: "Bahasa Indonesia", english: "English", system: "Use device setting", light: "Light", dark: "Dark",
    groups: "Groups", createGroup: "Create group", verifyAccount: "Verify account", bookmarks: "Bookmarks", soon: "SOON",
    whatsHappening: "What's happening?", post: "Post", noPosts: "No posts yet. Start the conversation!",
    comments: "Comments", repost: "Repost", likePost: "Like post; hold for more reactions", reactionChoices: "Reaction choices",
    like: "Like", removeBookmark: "Remove bookmark", bookmark: "Bookmark", postMenu: "Post menu",
    editPost: "Edit post", deletePost: "Delete post", report: "Report", writeComment: "Write a comment…",
    reply: "Reply", deleteComment: "Delete comment", updatePost: "Update your post.", cancel: "Cancel", save: "Save",
    reportPost: "Report post", reportPrivate: "Choose the best reason. Your report is private.",
    reason: "Reason", sendReport: "Send report", spam: "Spam", harassment: "Harassment", misinformation: "Misinformation",
    illegal: "Illegal content", other: "Other", postUpdated: "Post updated", postDeleted: "Post deleted",
    bookmarkRemoved: "Bookmark removed", postSaved: "Post saved", reportSent: "Report sent",
    reportThanks: "Thank you for helping keep the community safe.", reactionFailed: "Could not add reaction.",
  },
} as const;

type CopyKey = keyof typeof copy.id;
type PreferencesValue = {
  language: LanguagePreference; setLanguage: (value: LanguagePreference) => void;
  theme: ThemePreference; setTheme: (value: ThemePreference) => void;
  locale: Locale; t: (key: CopyKey) => string;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguagePreference>("auto");
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [deviceLocale, setDeviceLocale] = useState<Locale>("id");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("mindcaster-language") as LanguagePreference | null;
    const savedTheme = window.localStorage.getItem("mindcaster-theme") as ThemePreference | null;
    if (savedLanguage === "auto" || savedLanguage === "id" || savedLanguage === "en") setLanguageState(savedLanguage);
    if (savedTheme === "system" || savedTheme === "light" || savedTheme === "dark") setThemeState(savedTheme);
    setDeviceLocale(window.navigator.language.toLowerCase().startsWith("id") ? "id" : "en");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  const locale = language === "auto" ? deviceLocale : language;
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  const value = useMemo<PreferencesValue>(() => ({
    language,
    setLanguage: (next) => { setLanguageState(next); window.localStorage.setItem("mindcaster-language", next); },
    theme,
    setTheme: (next) => { setThemeState(next); window.localStorage.setItem("mindcaster-theme", next); },
    locale,
    t: (key) => copy[locale][key],
  }), [language, theme, locale]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
}