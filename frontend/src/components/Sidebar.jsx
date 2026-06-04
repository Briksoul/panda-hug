import { useState, useEffect } from "react";

const agentLabels = {
  triage: { name: "Triage Agent", desc: "初筛评估", emoji: "🐼", color: "indigo" },
  counselor: { name: "Counselor Agent", desc: "心理咨询", emoji: "💬", color: "blue" },
  sensing: { name: "Sensing Agent", desc: "情感分析", emoji: "📡", color: "amber" },
  risk: { name: "Risk Agent", desc: "危机监测", emoji: "⚠️", color: "orange" },
  case_formulation: { name: "CaseFormulation", desc: "案例构建", emoji: "📋", color: "teal" },
  supervisor: { name: "Supervisor Agent", desc: "咨询督导", emoji: "👁️", color: "slate" },
  cultural: { name: "Cultural Agent", desc: "跨文化分析", emoji: "🧠", color: "purple" },
  insight_report: { name: "InsightReport", desc: "洞察报告", emoji: "📊", color: "pink" },
  coach: { name: "Coach Agent", desc: "干预训练", emoji: "🧘", color: "cyan" },
  crisis: { name: "Crisis Agent", desc: "危机守护", emoji: "🛡️", color: "red" },
  knowledge: { name: "Knowledge Base", desc: "知识检索", emoji: "📚", color: "emerald" },
};

const colorMap = {
  indigo: { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-600", dot: "bg-indigo-500", glow: "shadow-indigo-200" },
  blue: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-600", dot: "bg-blue-500", glow: "shadow-blue-200" },
  amber: { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-600", dot: "bg-amber-500", glow: "shadow-amber-200" },
  orange: { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-600", dot: "bg-orange-500", glow: "shadow-orange-200" },
  teal: { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-600", dot: "bg-teal-500", glow: "shadow-teal-200" },
  slate: { bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-600", dot: "bg-slate-500", glow: "shadow-slate-200" },
  purple: { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-600", dot: "bg-purple-500", glow: "shadow-purple-200" },
  pink: { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-600", dot: "bg-pink-500", glow: "shadow-pink-200" },
  cyan: { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-600", dot: "bg-cyan-500", glow: "shadow-cyan-200" },
  red: { bg: "bg-red-100", border: "border-red-300", text: "text-red-600", dot: "bg-red-500", glow: "shadow-red-200" },
  emerald: { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-600", dot: "bg-emerald-500", glow: "shadow-emerald-200" },
};

const emotionColors = {
  positive: { label: "积极", color: "bg-green-400", text: "text-green-600" },
  mild: { label: "轻微", color: "bg-yellow-400", text: "text-yellow-600" },
  moderate: { label: "中等", color: "bg-orange-400", text: "text-orange-600" },
  severe: { label: "严重", color: "bg-red-400", text: "text-red-600" },
  crisis: { label: "危机", color: "bg-red-600", text: "text-red-700" },
};

const phases = [
  { key: "triage", label: "初筛评估" },
  { key: "counseling", label: "心理咨询" },
  { key: "insight_report", label: "洞察报告" },
  { key: "coaching", label: "干预训练" },
];

export default function Sidebar({ state, agentTrace, onNewSession }) {
  const [animatedTrace, setAnimatedTrace] = useState([]);

  // 逐条动画显示 agent trace
  useEffect(() => {
    if (!agentTrace || agentTrace.length === 0) return;

    setAnimatedTrace([]);
    agentTrace.forEach((item, i) => {
      setTimeout(() => {
        setAnimatedTrace((prev) => [...prev, { ...item, revealed: true }]);
      }, i * 600); // 每条间隔 600ms
    });
  }, [agentTrace]);

  if (!state) return null;

  const profile = state.profile || {};
  const emotion = emotionColors[profile.emotion_level] || emotionColors.mild;
  const currentPhaseIdx = phases.findIndex((p) => p.key === state.phase);

  return (
    <div className="w-80 h-screen bg-white/90 backdrop-blur-sm border-r border-gray-100 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐼</span>
          <span className="font-bold text-gray-700 text-lg">Panda Hug</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">跨文化智能心理伴侣</p>
      </div>

      {/* Agent 思考状态监视器 */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <p className="text-xs text-gray-500 font-semibold tracking-wide uppercase">Agent Pipeline</p>
        </div>

        {animatedTrace.length > 0 ? (
          <div className="space-y-2">
            {animatedTrace.map((item, i) => {
              const agent = agentLabels[item.agent] || agentLabels.triage;
              const colors = colorMap[agent.color] || colorMap.indigo;
              const isActive = item.status === "thinking" || item.status === "analyzing" || item.status === "searching";
              const isDone = item.status === "done";
              const isTransition = item.status === "transition";
              const isTriggered = item.status === "triggered";

              return (
                <div
                  key={i}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-500
                    ${isActive ? `${colors.bg} ${colors.border} shadow-md ${colors.glow}` : ""}
                    ${isDone ? `${colors.bg} ${colors.border} opacity-70` : ""}
                    ${isTransition ? "bg-indigo-50 border-indigo-200 border-dashed" : ""}
                    ${isTriggered ? "bg-red-50 border-red-300 shadow-md shadow-red-200" : ""}
                    ${!isActive && !isDone && !isTransition && !isTriggered ? "bg-gray-50 border-gray-200" : ""}
                    animate-[slideIn_0.3s_ease-out]
                  `}
                >
                  {/* 状态指示灯 */}
                  <div className="flex-shrink-0">
                    {isActive ? (
                      <div className={`w-5 h-5 rounded-full ${colors.dot} animate-ping opacity-75`}></div>
                    ) : isDone ? (
                      <div className={`w-5 h-5 rounded-full ${colors.dot} flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isTriggered ? (
                      <div className="w-5 h-5 rounded-full bg-red-500 animate-bounce flex items-center justify-center">
                        <span className="text-xs text-white">!</span>
                      </div>
                    ) : (
                      <div className={`w-5 h-5 rounded-full ${colors.dot} opacity-40`}></div>
                    )}
                  </div>

                  {/* 文字 */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isActive || isTriggered ? colors.text : "text-gray-500"}`}>
                      {item.label}
                    </p>
                    {item.detail && (
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.detail}</p>
                    )}
                  </div>

                  {/* 动画 loading */}
                  {isActive && (
                    <div className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0s" }}></span>
                      <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                      <span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.3s" }}></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400">等待用户输入...</p>
          </div>
        )}
      </div>

      {/* 用户信息 */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-sm font-medium">
            {profile.name ? profile.name[0] : "?"}
          </div>
          <div>
            <p className="font-medium text-gray-700 text-sm">{profile.name || "匿名用户"}</p>
            <p className="text-xs text-gray-400">{profile.cultural_bg || "待确认"}</p>
          </div>
        </div>
      </div>

      {/* 情绪状态 */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-2 font-medium">情绪状态</p>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${emotion.color}`}></div>
          <span className={`text-sm font-medium ${emotion.text}`}>{emotion.label}</span>
        </div>
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>PHQ-2 (抑郁)</span>
              <span>{profile.phq2_score}/6</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all" style={{ width: `${(profile.phq2_score / 6) * 100}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>GAD-2 (焦虑)</span>
              <span>{profile.gad2_score}/6</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all" style={{ width: `${(profile.gad2_score / 6) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 流程进度 */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-3 font-medium">咨询流程</p>
        <div className="space-y-3">
          {phases.map((phase, i) => {
            const isActive = i === currentPhaseIdx;
            const isDone = i < currentPhaseIdx;
            return (
              <div key={phase.key} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isActive ? "bg-indigo-500 text-white" : isDone ? "bg-green-400 text-white" : "bg-gray-200 text-gray-400"}`}>
                  {isDone ? "✓" : i + 1}
                </div>
                <span className={`text-sm ${isActive ? "text-indigo-600 font-medium" : isDone ? "text-green-600" : "text-gray-400"}`}>
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 当前 Agent */}
      <div className="px-5 py-4">
        <p className="text-xs text-gray-400 mb-2 font-medium">当前对话</p>
        <div className="flex items-center gap-2">
          <span className="text-lg">{(agentLabels[state.current_agent] || agentLabels.triage).emoji}</span>
          <span className={`text-sm font-medium text-${(agentLabels[state.current_agent] || agentLabels.triage).color}-500`}>
            {(agentLabels[state.current_agent] || agentLabels.triage).name}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">对话轮次：{profile.turns || 0}</p>
      </div>

      {/* 新建会话 */}
      <div className="mt-auto px-5 py-4 border-t border-gray-100">
        <button onClick={onNewSession} className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 transition-all">
          ➕ 新建会话
        </button>
      </div>
    </div>
  );
}
