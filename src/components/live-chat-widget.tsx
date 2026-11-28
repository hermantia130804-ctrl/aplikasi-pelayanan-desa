"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };
type Phase = "onboard_nama" | "onboard_nik" | "onboard_email" | "chat";

// NIK wajib 16 digit angka persis.
const NIK_RE = /^\d{16}$/;
// Email wajib format valid dengan domain (ada @ + domain dengan titik).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MSG_SAMBUTAN =
  "Selamat datang di Asisten Digital Desa Sukamaju! Sebelum kita mulai, saya perlu mencatat identitas Anda terlebih dahulu. Silakan ketik NAMA lengkap Anda.";

const labelPhase: Record<Phase, string> = {
  onboard_nama: "Langkah 1 dari 3 · Nama",
  onboard_nik: "Langkah 2 dari 3 · NIK",
  onboard_email: "Langkah 3 dari 3 · Email",
  chat: "Asisten Digital Desa",
};

export function LiveChatWidget({ loggedIn = true }: { loggedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("onboard_nama");
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);        // tampilan: onboarding + chat
  const [chatHistory, setChatHistory] = useState<Msg[]>([]);   // konteks LLM: Q&A chat saja
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open, loading]);

  const pushMsg = (m: Msg) => setMessages((prev) => [...prev, m]);

  // Buka chat -> mulai onboarding dari awal (sapaan + tanya nama).
  const buka = () => {
    setPhase("onboard_nama");
    setNama("");
    setNik("");
    setEmail("");
    setMessages([{ role: "assistant", content: MSG_SAMBUTAN }]);
    setChatHistory([]);
    setInput("");
    autoSentRef.current = false;
    setOpen(true);
  };

  const handleOnboard = (teks: string) => {
    const trimmed = teks.trim();

    if (phase === "onboard_nama") {
      if (!trimmed) {
        pushMsg({ role: "assistant", content: "Nama tidak boleh kosong. Silakan ketik NAMA lengkap Anda." });
        return;
      }
      setNama(trimmed);
      pushMsg({ role: "user", content: trimmed });
      pushMsg({ role: "assistant", content: `Halo ${trimmed}! Sekarang silakan ketik NIK Anda (16 digit angka).` });
      setPhase("onboard_nik");
      return;
    }

    if (phase === "onboard_nik") {
      pushMsg({ role: "user", content: trimmed });
      if (!NIK_RE.test(trimmed)) {
        pushMsg({
          role: "assistant",
          content: "NIK harus terdiri dari 16 digit angka. NIK yang Anda masukkan tidak sesuai. Silakan ketik ulang NIK Anda.",
        });
        return;
      }
      setNik(trimmed);
      pushMsg({ role: "assistant", content: "Terima kasih! Terakhir, silakan ketik EMAIL aktif Anda (contoh: nama@gmail.com)." });
      setPhase("onboard_email");
      return;
    }

    if (phase === "onboard_email") {
      pushMsg({ role: "user", content: trimmed });
      if (!EMAIL_RE.test(trimmed)) {
        pushMsg({
          role: "assistant",
          content: "Format email tidak valid. Pastikan email memiliki tanda @ dan domain (contoh: nama@gmail.com). Silakan ketik ulang email Anda.",
        });
        return;
      }
      setEmail(trimmed);
      pushMsg({
        role: "assistant",
        content: `Terima kasih ${nama}! Identitas Anda telah tercatat. NIK: ${nik}, Email: ${trimmed}. Sekarang saya siap membantu — silakan tanyakan apa pun seputar layanan desa, surat-surat, atau bansos.`,
      });
      setPhase("chat");
      return;
    }
  };

  const kirimChat = async (teks: string) => {
    const trimmed = teks.trim();
    if (!trimmed || loading) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const newHist = [...chatHistory, userMsg];
    setChatHistory(newHist);
    pushMsg(userMsg);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/livechat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: chatHistory,
          nama,
          nik,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Gagal menghubungi asisten.");
      }
      const replyMsg: Msg = { role: "assistant", content: data.reply };
      setChatHistory([...newHist, replyMsg]);
      pushMsg(replyMsg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan.";
      toast.error(msg);
      pushMsg({
        role: "assistant",
        content: "Maaf, terjadi kendala teknis saat memproses pesan Anda. Silakan coba kirim ulang sebentar lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const teks = input;
    setInput("");
    if (!teks.trim()) return;
    if (phase === "chat") kirimChat(teks);
    else handleOnboard(teks);
  };

  // Kirim riwayat percakapan (Q&A chat) ke email yang dikumpulkan di onboarding.
  const kirimEmail = async () => {
    if (chatHistory.length === 0 || sendingEmail) return;
    if (!email) {
      toast.error("Email belum tersedia. Selesaikan pendaftaran di awal chat.");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch("/api/livechat/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, email, name: nama }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal mengirim email.");
      toast.success(`Riwayat percakapan terkirim ke ${data.sentTo}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengirim email.");
    } finally {
      setSendingEmail(false);
    }
  };

  // Tutup chat: bila sudah ada percakapan Q&A, kirim riwayat ke email (sekali),
  // lalu tutup panel. Memenuhi: "saat chat ditutup/berakhir, histori dikirim ke email".
  const tutup = () => {
    if (phase === "chat" && chatHistory.length > 0 && !autoSentRef.current && !sendingEmail) {
      autoSentRef.current = true;
      void kirimEmail();
    }
    setOpen(false);
  };

  const placeholder =
    phase === "onboard_nama"
      ? "Ketik nama lengkap Anda..."
      : phase === "onboard_nik"
        ? "Ketik NIK (16 digit angka)..."
        : phase === "onboard_email"
          ? "Ketik email aktif Anda..."
          : "Ketik pertanyaan Anda...";

  const inputMax = phase === "onboard_nik" ? 16 : phase === "onboard_email" ? 120 : 1000;

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? tutup() : buka())}
        aria-label={open ? "Tutup livechat" : "Buka livechat"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Livechat Asisten Digital Desa"
          className="fixed bottom-24 right-5 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-xl border bg-card shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <MessageCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">Asisten Digital Desa</p>
                <p className="text-xs text-muted-foreground leading-tight">{labelPhase[phase]}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={tutup}
              aria-label="Tutup"
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Daftar pesan */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">Asisten sedang mengetik...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Aksi bawah + input */}
          <div className="space-y-2 border-t p-2">
            {phase === "chat" && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={kirimEmail}
                  disabled={sendingEmail || loading}
                  className="flex-1 text-xs"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Mengirim...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-1 h-3 w-3" /> Kirim riwayat ke email saya
                    </>
                  )}
                </Button>
              </div>
            )}
            <form onSubmit={onSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                disabled={loading}
                maxLength={inputMax}
                inputMode={phase === "onboard_nik" ? "numeric" : "text"}
                aria-label={
                  phase === "chat" ? "Pesan livechat" : "Input onboarding livechat"
                }
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                aria-label="Kirim"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
