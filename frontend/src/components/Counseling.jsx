import { useState, useRef, useEffect } from "react";

const commModes = [
  { id: "video", emoji: "📹", zh: "视频通话", en: "Video Call", color: "from-teal-200 to-cyan-200", border: "border-teal-300" },
  { id: "voice", emoji: "🎤", zh: "语音通话", en: "Voice Call", color: "from-amber-200 to-yellow-200", border: "border-amber-300" },
  { id: "text", emoji: "💬", zh: "文字聊天", en: "Text Chat", color: "from-purple-200 to-violet-200", border: "border-purple-300" },
];

export default function Counseling({ sessionId, messages, onSend, loading, state, onNavigate, onGoNext, language }) {
  const isZh = language === "zh";
  const [mode, setMode] = useState(null); // null | "video" | "voice" | "text"
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput("");
  };

  // 选择沟通方式
  if (!mode) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">🐼</div>
        <h2 className="text-2xl font-bold text-[#3a2a1a] mb-2">
          {isZh ? "选择一种舒服的方式，和Panda聊聊吧" : "Choose a comfortable way to chat with Panda"}
        </h2>
        <p className="text-[#6a5a4a] mb-8">
          {isZh ? "我会在这里倾听你的每一句话" : "I'll be here listening to every word you say"}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {commModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br ${m.color} border ${m.border} hover:scale-105 hover:shadow-lg transition-all`}
            >
              <span className="text-5xl">{m.emoji}</span>
              <span className="text-lg font-bold text-[#3a2a1a]">
                {isZh ? m.zh : m.en}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 对话界面
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-120px)]">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🐼</div>
          <div>
            <h3 className="font-bold text-[#3a2a1a]">
              {isZh ? "Panda 心理咨询师" : "Panda Counselor"}
            </h3>
            <p className="text-xs text-[#8a7a6a]">
              {mode === "video" ? "📹 视频通话" : mode === "voice" ? "🎤 语音通话" : "💬 文字聊天"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setMode(null)}
          className="px-3 py-1.5 rounded-lg text-xs text-[#8a7a6a] hover:text-[#5a4a3a] hover:bg-[#f5efe6] border border-[#e8ddd0]"
        >
          {isZh ? "更换方式" : "Change mode"}
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {/* 欢迎消息 */}
        {messages.length === 0 && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-xl">
              🐼
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-[#e8ddd0] shadow-sm max-w-[80%]">
              <p className="text-[#5a4a3a]">
                {isZh
                  ? "我是陪伴你的 Panda。很高兴和你连接上，你愿意和我说说最近发生了什么吗？"
                  : "I'm Panda, your companion. I'm glad to connect with you. Would you like to tell me what's been happening recently?"}
              </p>
            </div>
          </div>
        )}

        {/* 消息列表 */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.role !== "user" && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-xl">
                🐼
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-md"
                  : "bg-white border border-[#e8ddd0] text-[#5a4a3a] rounded-bl-md shadow-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-sm">
                👤
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center text-xl">
              🐼
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-[#e8ddd0] shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#8a7a6a] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#8a7a6a] animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                <span className="w-2 h-2 rounded-full bg-[#8a7a6a] animate-bounce" style={{ animationDelay: "0.4s" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 建议选项 */}
      {messages.length > 0 && messages[messages.length - 1]?.suggestions?.length > 0 && !loading && (
        <div className="flex flex-wrap gap-2 mb-3">
          {messages[messages.length - 1].suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSend(s)}
              className="px-4 py-2 rounded-full bg-[#faf6f0] border border-[#e8ddd0] text-sm text-[#5a4a3a] hover:bg-[#f0e6d8] transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 超链接按钮 */}
      {messages.length > 0 && messages[messages.length - 1]?.action_links?.length > 0 && !loading && (
        <div className="flex flex-wrap gap-2 mb-3">
          {messages[messages.length - 1].action_links.map((link, i) => (
            <button
              key={i}
              onClick={() => {
                if (link.type === "next") onGoNext();
                else onNavigate(link.phase);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                link.type === "next"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg"
                  : "bg-[#faf6f0] border border-[#e8ddd0] text-[#5a4a3a] hover:bg-[#f0e6d8]"
              }`}
            >
              {link.label} {link.type === "next" ? "→" : ""}
            </button>
          ))}
        </div>
      )}

      {/* 输入区 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isZh ? "说说你的感受..." : "Share your feelings..."}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-2xl bg-white border border-[#e8ddd0] text-[#5a4a3a] placeholder-[#b8a898] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
        >
          {isZh ? "发送" : "Send"}
        </button>
      </form>
    </div>
  );
}
