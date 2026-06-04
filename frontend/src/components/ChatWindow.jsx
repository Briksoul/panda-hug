import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import SuggestionChips from "./SuggestionChips";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({ messages, onSend, loading }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  // 获取最后一条助手消息的建议
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestions = lastAssistant?.suggestions || [];

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐼</span>
          <div>
            <h2 className="font-semibold text-gray-800">Panda Hug</h2>
            <p className="text-xs text-gray-400">你的心理陪伴助手</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-xs text-gray-400">在线</span>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* 建议选项 */}
      {suggestions.length > 0 && !loading && (
        <SuggestionChips suggestions={suggestions} onSelect={handleSuggestion} />
      )}

      {/* 输入区 */}
      <form
        onSubmit={handleSubmit}
        className="px-4 pb-4 pt-2"
      >
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="说说你的感受..."
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
          🔒 对话内容保密 · 如遇紧急情况请拨打 400-161-9995
        </p>
      </form>
    </div>
  );
}
