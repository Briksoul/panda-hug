import { useState } from "react";

export default function MessageBubble({ message, onNavigate }) {
  const isUser = message.role === "user";
  const agent = message.agent || "system";

  // Agent 头像映射
  const agentAvatar = {
    cognitive_orchestrator: "🐼",
    counselor: "💬",
    sensing: "📡",
    risk: "⚠️",
    case_formulation: "📋",
    insight_report: "📊",
    coach: "🧘",
    system: "🤖",
  }[agent] || "🐼";

  // 渲染内容中的超链接标记
  const renderContent = (content) => {
    if (!content) return null;

    // 匹配「关键字」格式的超链接
    const linkRegex = /「([^」]+)」/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      // 添加链接前的文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex}>
            {formatText(content.slice(lastIndex, match.index))}
          </span>
        );
      }

      // 添加超链接
      const linkText = match[1];
      const phaseMap = {
        "陪你倾诉": "counseling",
        "Talk Together": "counseling",
        "看见自己": "insight",
        "See Yourself": "insight",
        "一起练习": "coaching",
        "Practice Together": "coaching",
        "懂你情绪": "emotion_check",
        "Understand Emotions": "emotion_check",
      };
      const targetPhase = phaseMap[linkText];

      if (targetPhase && onNavigate) {
        parts.push(
          <button
            key={match.index}
            onClick={() => onNavigate(targetPhase)}
            className="text-indigo-500 hover:text-indigo-700 underline font-medium cursor-pointer transition-colors"
          >
            {linkText}
          </button>
        );
      } else {
        parts.push(
          <span key={match.index} className="text-indigo-500 font-medium">
            「{linkText}」
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余文本
    if (lastIndex < content.length) {
      parts.push(
        <span key={lastIndex}>
          {formatText(content.slice(lastIndex))}
        </span>
      );
    }

    return parts.length > 0 ? parts : formatText(content);
  };

  // 格式化文本（处理换行和粗体）
  const formatText = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {i > 0 && <br />}
        {line.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </span>
    ));
  };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* 头像 */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg">
          {agentAvatar}
        </div>
      )}

      {/* 消息内容 */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-indigo-500 text-white rounded-br-md"
            : "bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm"
        }`}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderContent(message.content)}
        </div>

        {/* 元数据（调试用，可隐藏） */}
        {message.metadata?.phase && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Phase: {message.metadata.phase}
            </span>
          </div>
        )}
      </div>

      {/* 用户头像 */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-sm font-medium">
          👤
        </div>
      )}
    </div>
  );
}
