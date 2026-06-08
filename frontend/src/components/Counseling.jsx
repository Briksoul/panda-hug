import { useState, useRef, useEffect } from "react";
import panda3 from "../assets/panda-3.png";

const commModes = [
  { id: "video", zh: "视频通话", en: "Video Call", gradient: "linear-gradient(135deg, #D0F0E8, #A0E0D0)", shadow: "rgba(72,187,120,0.2)", iconColor: "#38A169",
    icon: <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="#38A169" strokeWidth="2" strokeLinecap="round"><rect x="6" y="12" width="28" height="24" rx="4" /><path d="M34 20 L44 14 V34 L34 28" /></svg> },
  { id: "voice", zh: "语音通话", en: "Voice Call", gradient: "linear-gradient(135deg, #FFF3D4, #FFE8B0)", shadow: "rgba(232,184,75,0.2)", iconColor: "#B7791F",
    icon: <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="#B7791F" strokeWidth="2" strokeLinecap="round"><rect x="16" y="6" width="16" height="28" rx="8" /><path d="M10 24 C10 32 16 38 24 38 C32 38 38 32 38 24" /><path d="M24 38 V44" /><path d="M16 44 H32" /></svg> },
  { id: "text", zh: "文字聊天", en: "Text Chat", gradient: "linear-gradient(135deg, #E8D8F5, #D0B8E8)", shadow: "rgba(159,122,234,0.2)", iconColor: "#805AD5",
    icon: <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="#805AD5" strokeWidth="2" strokeLinecap="round"><rect x="6" y="8" width="36" height="26" rx="5" /><circle cx="18" cy="21" r="2" fill="#805AD5" /><circle cx="25" cy="21" r="2" fill="#805AD5" /><circle cx="32" cy="21" r="2" fill="#805AD5" /><path d="M14 34 L22 40 L30 34" /></svg> },
];

export default function Counseling({ sessionId, messages, onSend, loading, state, onNavigate, onGoNext, language }) {
  const isZh = language === "zh";
  const [mode, setMode] = useState(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, [mode]);

  const handleSubmit = (e) => { e.preventDefault(); if (!input.trim() || loading) return; onSend(input); setInput(""); };

  // 沟通方式选择 — 严格按设计图
  if (!mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "linear-gradient(180deg, #F5EDE3, #F2E6D9)" }}>
        {/* 熊猫 + 光球 */}
        <div className="relative mb-8">
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 h-12 rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(232,200,112,0.35) 0%, transparent 70%)" }} />
          <img src={panda3} alt="Panda" className="w-44 h-44 object-contain relative z-10 drop-shadow-md"
            style={{ animation: "float 4s ease-in-out infinite" }} />
        </div>

        <h2 className="text-2xl font-bold text-[#4A3A2A] mb-2 text-center">
          {isZh ? "选择一种舒服的方式，和Panda聊聊吧" : "Choose a comfortable way to chat with Panda"}
        </h2>
        <p className="text-sm text-[#8A7A6A] mb-10 text-center">{isZh ? "我会在这里倾听你的每一句话" : "I'll be here listening"}</p>

        {/* 三个按钮 — 设计图风格：云朵底座 + 光晕 */}
        <div className="flex gap-8 mb-10">
          {commModes.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="flex flex-col items-center gap-3 group">
              {/* 按钮主体 */}
              <div className="relative px-8 py-7 rounded-2xl border border-white/70 hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                style={{ background: m.gradient, boxShadow: `0 8px 30px ${m.shadow}` }}>
                <div className="group-hover:scale-110 transition-transform duration-300">
                  {m.icon}
                </div>
              </div>
              {/* 云朵底座 */}
              <svg width="100" height="24" viewBox="0 0 100 24" className="opacity-40 -mt-1">
                <ellipse cx="50" cy="12" rx="40" ry="10" fill="#c8d0d8" />
                <ellipse cx="30" cy="10" rx="25" ry="8" fill="#d5dde5" />
                <ellipse cx="70" cy="10" rx="25" ry="8" fill="#d5dde5" />
              </svg>
              <span className="text-sm font-bold text-[#4A3A2A]">{isZh ? m.zh : m.en}</span>
            </button>
          ))}
        </div>

        {/* 底部引导按钮 */}
        <div className="px-8 py-3 rounded-xl border border-[#D0C0B0]" style={{ background: "rgba(250,246,240,0.8)" }}>
          <span className="text-sm text-[#6B5B4B] font-medium">{isZh ? "选择您的沟通方式" : "Choose your communication method"}</span>
        </div>

        <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`}</style>
      </div>
    );
  }

  // 对话界面
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #F5EDE3, #F2E6D9)" }}>
      <div className="max-w-3xl mx-auto w-full px-6 py-4 flex flex-col flex-1">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "linear-gradient(135deg, #FFF3D4, #FFE4A0)" }}>🐼</div>
            <div>
              <h3 className="font-bold text-[#4A3A2A]">{isZh ? "Panda 心理咨询师" : "Panda Counselor"}</h3>
              <p className="text-xs text-[#A89888]">{mode === "video" ? "📹" : mode === "voice" ? "🎤" : "💬"} {isZh ? commModes.find(c=>c.id===mode)?.zh : commModes.find(c=>c.id===mode)?.en}</p>
            </div>
          </div>
          <button onClick={() => setMode(null)} className="px-3 py-1.5 rounded-lg text-xs text-[#A89888] hover:text-[#5A4A3A] border border-[#E0D5C8] hover:bg-white/50 transition-all">
            {isZh ? "更换方式" : "Change"}
          </button>
        </div>

        {/* 消息区 */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: "linear-gradient(135deg, #FFF3D4, #FFE4A0)" }}>🐼</div>
              <div className="rounded-2xl rounded-bl-md px-5 py-3.5 border border-[#E8DDD0] max-w-[80%]" style={{ background: "rgba(255,255,255,0.7)" }}>
                <p className="text-[#5A4A3A] leading-relaxed">
                  {isZh ? "我是陪伴你的 Panda。很高兴和你连接上，你愿意和我说说最近发生了什么吗？" : "I'm Panda. I'm glad to connect. Would you like to tell me what's been happening?"}
                </p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role !== "user" && <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: "linear-gradient(135deg, #FFF3D4, #FFE4A0)" }}>🐼</div>}
              <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 ${msg.role === "user" ? "rounded-br-md text-white" : "rounded-bl-md border border-[#E8DDD0]"}`}
                style={{ background: msg.role === "user" ? "linear-gradient(135deg, #5B8DEF, #7B5BF0)" : "rgba(255,255,255,0.7)" }}>
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
              </div>
              {msg.role === "user" && <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg, #5B8DEF, #7B5BF0)" }}>👤</div>}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: "linear-gradient(135deg, #FFF3D4, #FFE4A0)" }}>🐼</div>
              <div className="rounded-2xl rounded-bl-md px-5 py-3.5 border border-[#E8DDD0]" style={{ background: "rgba(255,255,255,0.7)" }}>
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-[#A89888] animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 超链接按钮 */}
        {messages.length > 0 && messages[messages.length-1]?.action_links?.length > 0 && !loading && (
          <div className="flex flex-wrap gap-2 mb-3">
            {messages[messages.length-1].action_links.map((link, i) => (
              <button key={i} onClick={() => { if (link.type==="next") onGoNext(); else onNavigate(link.phase); }}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${link.type==="next" ? "text-white shadow-md hover:shadow-lg hover:scale-105" : "border border-[#E0D5C8] text-[#5A4A3A] hover:bg-white/50"}`}
                style={link.type==="next" ? { background: "linear-gradient(135deg, #5B8DEF, #7B5BF0)" } : {}}>
                {link.label} {link.type==="next" ? "→" : ""}
              </button>
            ))}
          </div>
        )}

        {/* 输入区 */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder={isZh ? "说说你的感受..." : "Share your feelings..."} disabled={loading}
            className="flex-1 px-5 py-3.5 rounded-2xl border border-[#E0D5C8] text-[#5A4A3A] placeholder-[#C0B0A0] focus:outline-none focus:border-[#E8B84B] focus:ring-2 focus:ring-[#E8B84B]/20 transition-all"
            style={{ background: "rgba(255,255,255,0.7)" }} />
          <button type="submit" disabled={loading || !input.trim()}
            className="px-7 py-3.5 rounded-2xl text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-40 transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #E8B84B, #E8943A)" }}>
            {isZh ? "发送" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
