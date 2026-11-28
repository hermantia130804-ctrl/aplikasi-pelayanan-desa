"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { aiChatAction, getLivechatAgentsAction, sendChatHistoryEmailAction } from "@/lib/server/actions/livechat";

// === Custom Logo: Headset + Chat Bubble ===
function CsLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Headset band */}
      <path d="M12 34 Q12 14 32 14 Q52 14 52 34" stroke="#1e3a5f" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Left ear cup */}
      <rect x="8" y="32" width="10" height="16" rx="4" fill="#1e3a5f" />
      {/* Right ear cup */}
      <rect x="46" y="32" width="10" height="16" rx="4" fill="#1e3a5f" />
      {/* Chat bubble */}
      <path d="M22 34 Q22 28 28 28 L44 28 Q50 28 50 34 L50 42 Q50 48 44 48 L34 48 L30 52 L31 48 Q22 48 22 42 Z" fill="#e85d3a" />
      {/* Three dots */}
      <circle cx="30" cy="38" r="2" fill="#fff" />
      <circle cx="36" cy="38" r="2" fill="#fff" />
      <circle cx="42" cy="38" r="2" fill="#fff" />
    </svg>
  );
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatHistoryRef = useRef<Array<{ role: string; content: string; timestamp: string }>>([]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, onboarding]);

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { role, content, timestamp: now }]);
    chatHistoryRef.current = [...chatHistoryRef.current, { role, content, timestamp: now }];
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]); setInput(""); setLoading(false);
    setOnboarding("name"); setUserInfo({ nama: "", nik: "", email: "" });
    setQuestionCount(0); setShowPetugasPrompt(false);
    chatHistoryRef.current = [];
  }, []);

  const handleOpen = () => {
    resetChat();
    setIsOpen(true);
    addMessage("assistant", "Selamat datang di CS AI Desa Sukamaju!\n\nSaya AI yang akan membantu menjawab pertanyaan seputar layanan desa, bantuan sosial, dan pertanyaan umum lainnya.\n\nUntuk memulai, silakan masukkan Nama Anda:");
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => resetChat(), 300);
  };

  const checkPetugasPrompt = (userText: string): boolean => {
    const lower = userText.toLowerCase().trim();
    if (["cs", "chat dengan petugas", "chat petugas", "petugas"].includes(lower)) return true;
    if (questionCount >= 3) return true;
    return false;
  };

  const offerPetugas = () => {
    setShowPetugasPrompt(true);
    addMessage("assistant", "Apakah Anda ingin terhubung dengan petugas? Ketik 'y' untuk ya, atau ketik pertanyaan lain untuk lanjut.");
  };

  const endChat = useCallback(async (finalMessage: string) => {
    addMessage("assistant", finalMessage);
    if (userInfo.email) {
      addMessage("assistant", "Histori chat sedang dikirim ke email Anda...");
      try {
        const r = await sendChatHistoryEmailAction(userInfo.email, userInfo.nama, chatHistoryRef.current);
        addMessage("assistant", r.status === 200
          ? "Histori berhasil dikirim ke " + userInfo.email + ". Terima kasih!"
          : "Gagal kirim email. Terima kasih telah menggunakan CS AI!");
      } catch {
        addMessage("assistant", "Gagal kirim email. Terima kasih!");
      }
    } else {
      addMessage("assistant", "Terima kasih telah menggunakan CS AI Desa Sukamaju!");
    }
    setTimeout(() => handleClose(), 3000);
  }, [userInfo, addMessage]);

  const handlePetugasResponse = async (text: string) => {
    const lower = text.toLowerCase().trim();
    if (["y", "ya", "iya"].includes(lower)) {
      const r = await getLivechatAgentsAction();
      const fetchedAgents = (r.status === 200 ? r.agents : []) as Agent[];
      if (fetchedAgents.length === 0) {
        await endChat("Saat ini petugas belum ada yang terdaftar di livechat. Silakan hubungi kantor desa di +62 812-8569-9854 (WA) pada jam Senin-Jumat 08.00-14.00 WIB.");
      } else {
        let list = "Berikut petugas yang tersedia:\n\n";
        fetchedAgents.forEach((a, i) => {
          const tugas = a.tugasPetugas ? (() => { try { return JSON.parse(a.tugasPetugas).join(", "); } catch { return a.jabatan || "Umum"; } })() : a.jabatan || "Umum";
          const phone = a.phone?.startsWith("0") ? "62" + a.phone.slice(1) : a.phone?.replace("+", "").replace(/\s/g, "");
          list += `${i + 1}. ${a.name} (${tugas})\n   WhatsApp: https://wa.me/${phone}\n\n`;
        });
        list += "Klik link untuk chat WhatsApp. Chat ini akan ditutup otomatis.";
        await endChat(list);
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
        if ((r as any).isPetugasRequest) {
          addMessage("assistant", r.reply);
          setShowPetugasPrompt(true);
        } else {
          addMessage("assistant", r.reply);
          if (checkPetugasPrompt(userText)) setTimeout(() => offerPetugas(), 500);
        }
      }
    } catch {
      addMessage("assistant", "Maaf, koneksi bermasalah. Ketik 'cs' untuk hubungi petugas.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    addMessage("user", text);

    if (onboarding === "name") {
      setUserInfo(p => ({ ...p, nama: text }));
      setOnboarding("nik");
      addMessage("assistant", `Halo ${text}! Masukkan NIK Anda:`);
      return;
    }
    if (onboarding === "nik") {
      setUserInfo(p => ({ ...p, nik: text }));
      setOnboarding("email");
      addMessage("assistant", "Masukkan email Anda (histori chat akan dikirim ke email ini):");
      return;
    }
    if (onboarding === "email") {
      setUserInfo(p => ({ ...p, email: text }));
      setOnboarding("chat");
      addMessage("assistant", "Sempurna! Sekarang tanyakan apa saja seputar layanan desa, bansos, atau pertanyaan umum. Ketik 'cs' untuk hubungi petugas.");
      return;
    }
    if (showPetugasPrompt) { await handlePetugasResponse(text); return; }
    setQuestionCount(p => p + 1);
    await sendToAI(text);
  };

  return (
    <>
      {/* Floating button — custom logo headset + chat bubble */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-5 right-5 z-50 flex items-center justify-center rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 border border-gray-100"
          style={{ width: 60, height: 60 }}
          title="CS AI Desa Sukamaju"
        >
          <CsLogo size={40} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-50 w-full sm:bottom-5 sm:right-5 sm:w-96 sm:rounded-2xl bg-white shadow-2xl flex flex-col" style={{ height: "80vh", maxHeight: "600px" }}>
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-3 sm:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 rounded-xl p-1">
                <CsLogo size={28} />
              </div>
              <div>
                <p className="font-semibold text-sm">CS AI Desa Sukamaju</p>
                <p className="text-xs text-white/70">AI Online · siap bantu</p>
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
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white border text-gray-800 rounded-bl-sm shadow-sm"
                }`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 mb-1 text-xs text-gray-400">
                      <CsLogo size={14} /> CS AI
                    </div>
                  )}
                  {msg.content}
                  <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-white/50" : "text-gray-400"}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {onboarding !== "ended" && (
            <div className="border-t p-3 bg-white">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={onboarding === "name" ? "Masukkan nama..." : onboarding === "nik" ? "Masukkan NIK..." : onboarding === "email" ? "Masukkan email..." : "Ketik pertanyaan..."}
                  disabled={loading}
                  className="flex-1 text-sm"
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon" className="bg-blue-700 hover:bg-blue-800 shrink-0">
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
