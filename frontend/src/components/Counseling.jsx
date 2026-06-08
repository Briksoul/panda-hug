import { useState, useRef, useEffect } from "react";
import panda3 from "../assets/panda-3.png";

const commModes = [
  { id: "video", zh: "视频通话", en: "Video Call", gradient: "linear-gradient(135deg, #D0F0E8, #A0E0D0)", shadow: "rgba(72,187,120,0.2)",
    icon: <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="#38A169" strokeWidth="2" strokeLinecap="round"><rect x="6" y="12" width="28" height="24" rx="4" /><path d="M34 20 L44 14 V34 L34 28" /></svg> },
  { id: "voice", zh: "语音通话", en: "Voice Call", gradient: "linear-gradient(135deg, #FFF3D4, #FFE8B0)", shadow: "rgba(232,184,75,0.2)",
    icon: <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="#B7791F" strokeWidth="2" strokeLinecap="round"><rect x="16" y="6" width="16" height="28" rx="8" /><path d="M10 24 C10 32 16 38 24 38 C32 38 38 32 38 24" /><path d="M24 38 V44" /><path d="M16 44 H32" /></svg> },
  { id: "text", zh: "文字聊天", en: "Text Chat", gradient: "linear-gradient(135deg, #E8D8F5, #D0B8E8)", shadow: "rgba(159,122,234,0.2)",
    icon: <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="#805AD5" strokeWidth="2" strokeLinecap="round"><rect x="6" y="8" width="36" height="26" rx="5" /><circle cx="18" cy="21" r="2" fill="#805AD5" /><circle cx="25" cy="21" r="2" fill="#805AD5" /><circle cx="32" cy="21" r="2" fill="#805AD5" /><path d="M14 34 L22 40 L30 34" /></svg> },
];

export default function Counseling({ sessionId, messages, onSend, loading, state, onNavigate, onGoNext, language }) {
  const isZh = language === "zh";
  const [mode, setMode] = useState(null);
  const [input, setInput] = useState("");
  const [mediaError, setMediaError] = useState(null); // #1 多模态权限降级
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, [mode]);

  const handleSubmit = (e) => { e.preventDefault(); if (!input.trim() || loading) return; onSend(input); setInput(""); };

  // #1 多模态权限请求 + 降级处理
  const requestMedia = async (type) => {
    try {
      if (type === "video") {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else if (type === "voice") {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      setMode(type);
    } catch (err) {
      console.warn("[Media] Permission denied:", err);
      setMediaError(isZh
        ? "Panda 暂时无法看到/听到你，但我们依然可以通过文字陪伴你哦"
        : "Panda can't see/hear you right now, but we can still chat via text");
      setMode("text");
    }
  };

  // 选择沟通方式
  if (!mode) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">🐼</div>
        <h2 className="text-2xl font-bold text-[#3a2a1a] mb-2">
          {isZh ? "选择一种舒服的方式，和Panda聊聊吧" : "Choose a comfortable way to chat with Panda"}
        </h2>
        <p className="text-[#6a5a4a] mb-8">{isZh ? "我会在这里倾听你的每一句话" : "I'll be here listening"}</p>
        {mediaError && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            {mediaError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {commModes.map((m) => (
            <button key={m.id} onClick={() => {
              if (m.id === "text") { setMode("text"); }
              else { requestMedia(m.id); }
            }}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-white/60 hover:scale-105 hover:-translate-y-1 transition-all duration-300"
              style={{ background: m.gradient, boxShadow: `0 8px 30px ${m.shadow}` }}>
              {m.icon}
              <span className="text-lg font-bold text-[#3a2a1a]">{isZh ? m.zh : m.en}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // #2 骨架屏组件
  const SkeletonBubble = () => (
    <div className="flex gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-amber-100" />
      <div className="space-y-2">
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
    </div>
  );

  // 对话界面
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-120px)]">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-xl">🐼</div>
          <div>
            <h3 className="font-bold text-[#3a2a1a]">{isZh ? "Panda 心理咨询师" : "Panda Counselor"}</h3>
            <p className="text-xs text-[#8a7a6a]">{mode === "video" ? "📹" : mode === "voice" ? "🎤" : "💬"} {isZh ? commModes.find(c=>c.id===mode)?.zh : commModes.find(c=>c.id===mode)?.en}</p>
          </div>
        </div>
        <button onClick={() => { setMode(null); setMediaError(null); }} className="px-3 py-1.5 rounded-lg text-xs text-[#8a7a6a] hover:text-[#5a4a3a] hover:bg-[#f5efe6] border border-[#e8ddd0]">
          {isZh ? "更换方式" : "Change"}
        </button>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-xl">🐼</div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-[#e8ddd0] shadow-sm max-w-[80%]">
              <p className="text-[#5a4a3a]">
                {isZh ? "我是陪伴你的 Panda。很高兴和你连接上，你愿意和我说说最近发生了什么吗？" : "I'm Panda. I'm glad to connect. Would you like to tell me what's been happening?"}
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.role !== "user" && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-xl">🐼</div>}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-md" : "bg-white border border-[#e8ddd0] text-[#5a4a3a] rounded-bl-md shadow-sm"}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === "user" && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-sm">👤</div>}
          </div>
        ))}
        {/* #2 加载动画 */}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-xl">🐼</div>
            <div className="bg-white rounded-2xl rounded-bl-md px-5 py-3 border border-[#e8ddd0] shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8a7a6a]">{isZh ? "Panda 正在思考..." : "Panda thinking..."}</span>
                <div className="flex gap-1">
                  {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#8a7a6a] animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 建议选项 */}
      {messages.length > 0 && messages[messages.length-1]?.suggestions?.length > 0 && !loading && (
        <div className="flex flex-wrap gap-2 mb-3">
          {messages[messages.length-1].suggestions.map((s, i) => (
            <button key={i} onClick={() => onSend(s)} className="px-4 py-2 rounded-full bg-[#faf6f0] border border-[#e8ddd0] text-sm text-[#5a4a3a] hover:bg-[#f0e6d8] transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 超链接按钮 */}
      {messages.length > 0 && messages[messages.length-1]?.action_links?.length > 0 && !loading && (
        <div className="flex flex-wrap gap-2 mb-3">
          {messages[messages.length-1].action_links.map((link, i) => (
            <button key={i} onClick={() => { if (link.type==="next") onGoNext(); else onNavigate(link.phase); }}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${link.type==="next" ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg" : "bg-[#faf6f0] border border-[#e8ddd0] text-[#5a4a3a] hover:bg-[#f0e6d8]"}`}>
              {link.label} {link.type==="next" ? "→" : ""}
            </button>
          ))}
        </div>
      )}

      {/* 输入区 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
          placeholder={isZh ? "说说你的感受..." : "Share your feelings..."} disabled={loading}
          className="flex-1 px-4 py-3 rounded-2xl bg-white border border-[#e8ddd0] text-[#5a4a3a] placeholder-[#b8a898] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold hover:shadow-lg disabled:opacity-30 transition-all">
          {isZh ? "发送" : "Send"}
        </button>
      </form>
    </div>
  );
}
