"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTI = [
  "Cek bansos saya",
  "Bagaimana cara mengajukan KTP?",
  "Surat apa saja yang tersedia?",
];

const PEMBUKA_LOGIN =
  "Halo! Saya Asisten Digital Desa Sukamaju. Saya bisa bantu mengecek status bansos Anda (dengan NIK terdaftar) dan menjelaskan cara mengurus surat-surat desa. Ada yang bisa saya bantu?";
const PEMBUKA_TAMU =
  "Halo! Saya Asisten Digital Desa Sukamaju. Saya bisa menjelaskan layanan desa, cara mengurus surat, dan info pejabat desa. Untuk cek bansos pribadi, silakan masuk (login) dulu. Ada yang bisa saya bantu?";

export function LiveChatWidget({ loggedIn = true }: { loggedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  // Catat apakah riwayat percakapan saat ini sudah pernah dikirim ke email,
  // agar auto-kirim saat chat ditutup tidak mengirim berulang untuk percakapan yg sama.
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, open, loading]);

  const kirim = async (teks: string) => {
    const trimmed = teks.trim();
    if (!trimmed || loading) return;

    // Percakapan baru dimulai -> reset penanda auto-kirim email.
    if (messages.length === 0) autoSentRef.current = false;

    const userMsg: Msg = { role: "user", content: trimmed };
    const riwayat = [...messages, userMsg];
    setMessages(riwayat);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/livechat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Gagal menghubungi asisten.");
      }
      setMessages([...riwayat, { role: "assistant", content: data.reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan.";
      toast.error(msg);
      setMessages([
        ...riwayat,
        {
          role: "assistant",
          content:
            "Maaf, terjadi kendala teknis saat memproses pesan Anda. Silakan coba kirim ulang sebentar lagi.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const kirimEmail = async () => {
    if (messages.length === 0 || sendingEmail) return;
    // Tamu (belum login) wajib isi email dulu sebelum kirim riwayat.
    if (!loggedIn && !emailInput.trim()) {
      setShowEmailInput(true);
      return;
    }
    setSendingEmail(true);
    try {
      const payload: { messages: Msg[]; email?: string } = { messages };
      if (!loggedIn) payload.email = emailInput.trim();
      const res = await fetch("/api/livechat/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal mengirim email.");
      toast.success(`Riwayat terkirim ke ${data.sentTo}`);
      setShowEmailInput(false);
      setEmailInput("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal mengirim email.";
      toast.error(msg);
    } finally {
      setSendingEmail(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    kirim(input);
  };

  // Menutup chat: bila ada percakapan, otomatis kirim riwayat ke email user
  // (sekali per percakapan) lalu tutup panel. Memenuhi: "saat chat berakhir/keluar,
  // histori dikirim ke email".
  const tutup = () => {
    // Auto-kirim riwayat saat chat ditutup hanya untuk pengguna yang login
    // (email diambil dari sesi). Tamu belum punya email -> gunakan tombol
    // "Kirim riwayat ke email" + isi email secara manual.
    if (loggedIn && messages.length > 0 && !autoSentRef.current && !sendingEmail) {
      autoSentRef.current = true;
      void kirimEmail();
    }
    setOpen(false);
  };

  const hapusRiwayat = () => {
    setMessages([]);
    setInput("");
    autoSentRef.current = false;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? tutup() : setOpen(true))}
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
                <p className="text-xs text-muted-foreground leading-tight">Tanya seputar layanan &amp; bansos</p>
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
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
                    {loggedIn ? PEMBUKA_LOGIN : PEMBUKA_TAMU}
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  {SUGGESTI.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => kirim(s)}
                      className="rounded-lg border px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                      disabled={loading}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
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
              ))
            )}

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
            {messages.length > 0 && (
              <div className="space-y-2">
                {!loggedIn && showEmailInput && (
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="email Anda..."
                      disabled={sendingEmail}
                      maxLength={120}
                      aria-label="Email untuk kirim riwayat"
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={kirimEmail}
                      disabled={sendingEmail || !emailInput.trim()}
                      aria-label="Kirim ke email ini"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
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
                        <Mail className="mr-1 h-3 w-3" /> {loggedIn ? "Kirim riwayat ke email saya" : "Kirim riwayat ke email"}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={hapusRiwayat}
                    disabled={loading || sendingEmail}
                    className="text-xs text-muted-foreground"
                  >
                    Bersihkan
                  </Button>
                </div>
              </div>
            )}
            <form onSubmit={onSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pesan..."
                disabled={loading}
                maxLength={1000}
                aria-label="Pesan livechat"
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                aria-label="Kirim pesan"
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
