const agentConfig = {
  triage: { name: "接待助手", emoji: "🐼", color: "bg-indigo-500" },
  counselor: { name: "心理咨询师", emoji: "💬", color: "bg-blue-500" },
  sensing: { name: "感知引擎", emoji: "📡", color: "bg-amber-500" },
  risk: { name: "风险监测", emoji: "⚠️", color: "bg-orange-500" },
  case_formulation: { name: "案例构建", emoji: "📋", color: "bg-teal-500" },
  supervisor: { name: "咨询督导", emoji: "👁️", color: "bg-slate-500" },
  cultural: { name: "文化分析师", emoji: "🧠", color: "bg-purple-500" },
  insight_report: { name: "洞察报告", emoji: "📊", color: "bg-pink-500" },
  coach: { name: "训练教练", emoji: "🧘", color: "bg-cyan-500" },
  crisis: { name: "安全守护", emoji: "🛡️", color: "bg-red-500" },
  system: { name: "系统", emoji: "⚙️", color: "bg-gray-400" },
};

// 简单 Markdown 渲染（加粗、换行）
function renderText(text) {
  if (!text) return null;
  // 移除 JSON 代码块
  const cleaned = text.replace(/```json[\s\S]*?```/g, "").trim();
  const lines = cleaned.split("\n");

  return lines.map((line, i) => {
    // 加粗
    const parts = line.split(/(\*\*.*?\*\*)/).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <span key={i}>
        {parts}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const config = agentConfig[message.agent] || agentConfig.system;

  return (
    <div className={`flex gap-3 message-bubble ${isUser ? "flex-row-reverse" : ""}`}>
      {/* 头像 */}
      {!isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg shadow-sm">
          {config.emoji}
        </div>
      )}

      {/* 气泡 */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-tr-md"
            : "bg-white text-gray-700 border border-gray-100 rounded-tl-md"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.color}`}></span>
            <span className="text-xs text-gray-400 font-medium">{config.name}</span>
          </div>
        )}
        <div className="whitespace-pre-wrap">{renderText(message.content)}</div>
      </div>
    </div>
  );
}
