"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, Bot, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { aiChatAction, getLivechatAgentsAction, sendChatHistoryEmailAction } from "@/lib/server/actions/livechat";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

type OnboardingState = "name" | "nik" | "email" | "chat" | "ended";

interface Agent {
  userId: string;
  name: string;
  phone: string;
  jabatan: string | null;
  tugasPetugas: string | null;
}

export function CsAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingState>("name");
  const [userInfo, setUserInfo] = useState({ nama: "", nik: "", email: "" });
  const [questionCount, setQuestionCount] = useState(0);
  const [showPetugasPrompt, setShowPetugasPrompt] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Ref untuk simpan chat history terbaru (supaya tidak kena stale state)
  const chatHistoryRef = useRef<Array<{ role: string; content: string; timestamp: string }>>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, onboarding]);

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { role, content, timestamp: now }]);
    // Update ref segera (tidak kena stale state)
    chatHistoryRef.current = [...chatHistoryRef.current, { role, content, timestamp: now }];
  }, []);

  // === Reset semua state — dipanggil saat chat berakhir ===
  const resetChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setLoading(false);
    setOnboarding("name");
    setUserInfo({ nama: "", nik: "", email: "" });
    setQuestionCount(0);
    setShowPetugasPrompt(false);
    setAgents([]);
    chatHistoryRef.current = [];
  }, []);

  // === Buka chat — selalu mulai dari awal ===
  const handleOpen = () => {
    resetChat();
    setIsOpen(true);
    addMessage("assistant", "Selamat datang di CS AI Desa Sukamaju!\n\nSaya akan membantu menjawab pertanyaan seputar layanan desa dan bantuan sosial.\n\nUntuk memulai, silakan masukkan Nama Anda:");
  };

  // === Tutup chat — hapus histori ===
  const handleClose = () => {
    setIsOpen(false);
    // Reset setelah delay supaya animasi tutup smooth
    setTimeout(() => resetChat(), 300);
  };

  const checkPetugasPrompt = (userText: string): boolean => {
    const lower = userText.toLowerCase().trim();
    if (lower === "cs" || lower === "chat dengan petugas" || lower === "chat petugas" || lower === "petugas") {
      return true;
    }
    if (questionCount >= 3) {
      return true;
    }
    return false;
  };

  const offerPetugas = () => {
    setShowPetugasPrompt(true);
    addMessage("assistant", "Apakah Anda ingin terhubung dengan petugas? Ketik 'y' untuk ya, atau ketik pertanyaan lain untuk lanjut chat dengan AI.");
  };

  // === Akhiri chat — kirim email + tutup otomatis ===
  const endChat = useCallback(async (finalMessage: string) => {
    addMessage("assistant", finalMessage);

    // Kirim histori ke email
    if (userInfo.email) {
      addMessage("assistant", "Histori chat Anda sedang dikirim ke email. Mohon tunggu...");
      try {
        const r = await sendChatHistoryEmailAction(
          userInfo.email,
          userInfo.nama,
          chatHistoryRef.current // pakai ref, bukan state (hindari stale)
        );
        if (r.status === 200) {
          addMessage("assistant", "Histori chat berhasil dikirim ke " + userInfo.email + ". Terima kasih!");
        } else {
          addMessage("assistant", "Gagal mengirim histori ke email. Terima kasih telah menggunakan CS AI Desa Sukamaju!");
        }
      } catch {
        addMessage("assistant", "Gagal mengirim email. Terima kasih telah menggunakan CS AI Desa Sukamaju!");
      }
    } else {
      addMessage("assistant", "Terima kasih telah menggunakan CS AI Desa Sukamaju!");
    }

    // Tutup otomatis setelah 3 detik
    setTimeout(() => {
      handleClose();
    }, 3000);
  }, [userInfo, addMessage]);

  const handlePetugasResponse = async (text: string) => {
    const lower = text.toLowerCase().trim();
    if (lower === "y" || lower === "ya" || lower === "iya") {
      // Fetch agents
      const r = await getLivechatAgentsAction();
      const fetchedAgents = (r.status === 200 ? r.agents : []) as Agent[];
      setAgents(fetchedAgents);

      if (fetchedAgents.length === 0) {
        // Petugas belum ada yang terdaftar — bukan "terjadi kesalahan"
        await endChat("Maaf, saat ini petugas belum ada yang terdaftar di livechat. Silakan hubungi kantor desa langsung di +62 812-8569-9854 (WA) pada jam layanan Senin-Jumat, 08.00-14.00 WIB.");
      } else {
        let agentList = "Berikut daftar petugas yang tersedia:\n\n";
        fetchedAgents.forEach((a, i) => {
          const tugas = a.tugasPetugas ? (() => { try { return JSON.parse(a.tugasPetugas).join(", "); } catch { return a.jabatan || "Petugas Umum"; } })() : a.jabatan || "Petugas Umum";
          const phone = a.phone?.startsWith("0") ? "62" + a.phone.slice(1) : a.phone?.replace("+", "").replace(/\s/g, "");
          agentList += `${i + 1}. ${a.name} (${tugas})\n   WhatsApp: https://wa.me/${phone}\n\n`;
        });
        agentList += "Klik link WhatsApp di atas untuk terhubung langsung dengan petugas.\n\nChat ini akan ditutup otomatis. Histori akan dikirim ke email Anda.";
        await endChat(agentList);
      }
    } else {
      setShowPetugasPrompt(false);
      setOnboarding("chat");
      await sendToAI(text);
    }
  };

  const sendToAI = async (userText: string) => {
    setLoading(true);
    try {
      const chatMessages = chatHistoryRef.current.map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
      chatMessages.push({ role: "user", content: userText });

      const r = await aiChatAction(chatMessages);
      if (r.reply) {
        // Cek apakah AI menyarankan hubungi petugas
        if ((r as any).isPetugasRequest) {
          addMessage("assistant", "Apakah Anda ingin terhubung dengan petugas? Ketik 'y' untuk ya, atau ketik pertanyaan lain untuk lanjut chat dengan AI.");
          setShowPetugasPrompt(true);
        } else {
          addMessage("assistant", r.reply);
          if (checkPetugasPrompt(userText)) {
            setTimeout(() => offerPetugas(), 500);
          }
        }
      }
    } catch {
      addMessage("assistant", "Maaf, terjadi kesalahan. Silakan coba lagi atau ketik 'cs' untuk hubungi petugas.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    addMessage("user", text);

    // Onboarding flow
    if (onboarding === "name") {
      setUserInfo(prev => ({ ...prev, nama: text }));
      setOnboarding("nik");
      addMessage("assistant", `Halo ${text}!\n\nSelanjutnya, masukkan NIK Anda:`);
      return;
    }
    if (onboarding === "nik") {
      setUserInfo(prev => ({ ...prev, nik: text }));
      setOnboarding("email");
      addMessage("assistant", "Terima kasih! Terakhir, masukkan email Anda (histori chat akan dikirim ke email ini):");
      return;
    }
    if (onboarding === "email") {
      setUserInfo(prev => ({ ...prev, email: text }));
      setOnboarding("chat");
      addMessage("assistant", `Sempurna! Sekarang Anda bisa bertanya seputar layanan desa Sukamaju atau bantuan sosial.\n\nKetik "cs" jika ingin terhubung langsung dengan petugas via WhatsApp.`);
      return;
    }

    // Petugas prompt response
    if (showPetugasPrompt) {
      await handlePetugasResponse(text);
      return;
    }

    // Regular chat
    setQuestionCount(prev => prev + 1);
    await sendToAI(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button — menyerupai logo WhatsApp */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-5 right-5 z-50 flex items-center justify-center rounded-full bg-green-500 shadow-lg hover:shadow-xl transition-all hover:scale-105"
          style={{ width: 56, height: 56 }}
          title="CS AI Desa Sukamaju"
        >
          <MessageCircle className="h-7 w-7 text-white" fill="white" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-50 w-full sm:bottom-5 sm:right-5 sm:w-96 sm:rounded-2xl bg-white shadow-2xl flex flex-col" style={{ height: "80vh", maxHeight: "600px" }}>
          {/* Header — logo WhatsApp-like */}
          <div className="flex items-center justify-between bg-green-600 text-white px-4 py-3 sm:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full p-1.5">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">CS AI Desa Sukamaju</p>
                <p className="text-xs text-white/80">Online</p>
              </div>
            </div>
            <button onClick={handleClose} className="hover:bg-white/20 rounded-full p-1.5">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-green-500 text-white rounded-br-sm"
                    : "bg-white border text-gray-800 rounded-bl-sm shadow-sm"
                }`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 mb-1 text-xs text-gray-400">
                      <Bot className="h-3 w-3" /> CS AI
                    </div>
                  )}
                  {msg.content}
                  <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-white/60" : "text-gray-400"}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input — hidden saat chat ended */}
          {onboarding !== "ended" && (
            <div className="border-t p-3 bg-white">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    onboarding === "name" ? "Masukkan nama..." :
                    onboarding === "nik" ? "Masukkan NIK..." :
                    onboarding === "email" ? "Masukkan email..." :
                    "Ketik pertanyaan..."
                  }
                  disabled={loading}
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  size="icon"
                  className="bg-green-500 hover:bg-green-600 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
