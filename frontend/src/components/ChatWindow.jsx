import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import SuggestionChips from "./SuggestionChips";
import TypingIndicator from "./TypingIndicator";
import CrisisAlert from "./CrisisAlert";
import InsightReport from "./InsightReport";

export default function ChatWindow({ messages, onSend, loading, insightReport, currentPhase, onNavigate, language }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isZh = language === "zh";

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput("");
  };

  const handleSuggestion = (text) => {
    onSend(text);
  };

  // 获取最后一条助手消息的建议和链接
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestions = lastAssistant?.suggestions || [];
  const actionLinks = lastAssistant?.action_links || [];

  // 阶段标题
  const phaseTitles = {
    emotion_check: isZh ? "💭 懂你情绪" : "💭 Understand Emotions",
    counseling: isZh ? "💬 陪你倾诉" : "💬 Talk Together",
    insight: isZh ? "🪞 看见自己" : "🪞 See Yourself",
    coaching: isZh ? "🧘 一起练习" : "🧘 Practice Together",
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 阶段标题栏 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-700">
            {phaseTitles[currentPhase] || (isZh ? "🐼 Panda Hug" : "🐼 Panda Hug")}
          </span>
        </div>
        <button
          onClick={() => onNavigate("home")}
          className="text-sm text-gray-400 hover:text-indigo-500 transition-colors"
        >
          🏠 {isZh ? "返回主页" : "Home"}
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => {
          if (msg.metadata?.guardrail_triggered) {
            return <CrisisAlert key={i} message={msg} />;
          }
          return (
            <MessageBubble
              key={i}
              message={msg}
              onNavigate={onNavigate}
            />
          );
        })}
        {/* 心理洞察报告 */}
        {insightReport && Object.keys(insightReport).length > 0 && (
          <InsightReport report={insightReport} language={language} />
        )}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* 操作链接按钮 */}
      {actionLinks.length > 0 && !loading && (
        <div className="px-4 pb-2 flex flex-wrap gap-2 justify-center">
          {actionLinks.map((link, i) => (
            <button
              key={i}
              onClick={() => onNavigate(link.phase)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                link.type === "next"
                  ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                  : link.type === "home"
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-purple-100 text-purple-600 hover:bg-purple-200"
              }`}
            >
              {link.type === "next" ? `${link.label} →` : link.label}
            </button>
          ))}
        </div>
      )}

      {/* 建议选项 */}
      {suggestions.length > 0 && !loading && (
        <SuggestionChips suggestions={suggestions} onSelect={handleSuggestion} />
      )}

      {/* 输入区 */}
      <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isZh ? "说说你的感受..." : "Share your feelings..."}
            disabled={loading}
            className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent py-1"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-30 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-300 mt-2">
          🔒 {isZh ? "对话内容保密 · 如遇紧急情况请拨打 12356" : "Confidential · In emergency call 988"}
        </p>
      </form>
    </div>
  );
}
