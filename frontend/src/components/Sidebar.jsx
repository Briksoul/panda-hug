import { useState, useEffect } from "react";

const agentLabels = {
  cognitive_orchestrator: { name: "Cognitive Orchestrator", desc: "大脑调度", emoji: "🐼", color: "indigo" },
  counselor: { name: "Counselor Agent", desc: "心理咨询", emoji: "💬", color: "blue" },
  sensing: { name: "Sensing Agent", desc: "情感分析", emoji: "📡", color: "amber" },
  risk: { name: "Risk Agent", desc: "危机监测", emoji: "⚠️", color: "orange" },
  case_formulation: { name: "CaseFormulation", desc: "案例构建", emoji: "📋", color: "teal" },
  insight_report: { name: "InsightReport", desc: "洞察报告", emoji: "📊", color: "pink" },
  coach: { name: "Coach Agent", desc: "放松训练", emoji: "🧘", color: "cyan" },
  knowledge: { name: "Knowledge Base", desc: "知识检索", emoji: "📚", color: "emerald" },
};

const colorMap = {
  indigo: { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-600", dot: "bg-indigo-500" },
  blue: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-600", dot: "bg-blue-500" },
  amber: { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-600", dot: "bg-amber-500" },
  orange: { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-600", dot: "bg-orange-500" },
  teal: { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-600", dot: "bg-teal-500" },
  purple: { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-600", dot: "bg-purple-500" },
  pink: { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-600", dot: "bg-pink-500" },
  cyan: { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-600", dot: "bg-cyan-500" },
  emerald: { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-600", dot: "bg-emerald-500" },
};

const emotionColors = {
  positive: { label: "积极", labelEn: "Positive", color: "bg-green-400", text: "text-green-600" },
  mild: { label: "轻微", labelEn: "Mild", color: "bg-yellow-400", text: "text-yellow-600" },
  moderate: { label: "中等", labelEn: "Moderate", color: "bg-orange-400", text: "text-orange-600" },
  severe: { label: "严重", labelEn: "Severe", color: "bg-red-400", text: "text-red-600" },
  crisis: { label: "危机", labelEn: "Crisis", color: "bg-red-600", text: "text-red-700" },
};

const bearStatusMap = {
  happy: { emoji: "🐻", zh: "开心小熊", en: "Happy Bear" },
  calm: { emoji: "🐻", zh: "平静小熊", en: "Calm Bear" },
  tired: { emoji: "🐻", zh: "疲惫小熊", en: "Tired Bear" },
};

const phases = [
  { key: "emotion_check", label: "懂你情绪", labelEn: "Emotions" },
  { key: "counseling", label: "陪你倾诉", labelEn: "Talk" },
  { key: "insight", label: "看见自己", labelEn: "Insight" },
  { key: "coaching", label: "一起练习", labelEn: "Practice" },
];

export default function Sidebar({ state, agentTrace, onNewSession, onNavigate }) {
  const [animatedTrace, setAnimatedTrace] = useState([]);
  const language = state?.profile?.language || "zh";
  const isZh = language === "zh";

  // 逐条动画显示 agent trace
  useEffect(() => {
    if (!agentTrace || agentTrace.length === 0) return;
    setAnimatedTrace([]);
    agentTrace.forEach((item, i) => {
      setTimeout(() => {
        setAnimatedTrace((prev) => [...prev, { ...item, revealed: true }]);
      }, i * 600);
    });
  }, [agentTrace]);

  if (!state) return null;

  const profile = state.profile || {};
  const emotion = emotionColors[profile.emotion_level] || emotionColors.mild;
  const bear = bearStatusMap[profile.bear_status] || bearStatusMap.calm;
  const currentPhaseIdx = phases.findIndex((p) => p.key === state.current_phase);

  return (
    <div className="w-80 h-screen bg-white/90 backdrop-blur-sm border-r border-gray-100 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐼</span>
          <span className="font-bold text-gray-700 text-lg">Panda Hug</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {isZh ? "跨文化智能心理伴侣" : "Cross-cultural AI Companion"}
        </p>
      </div>

      {/* Agent Pipeline */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <p className="text-xs text-gray-500 font-semibold tracking-wide uppercase">Agent Pipeline</p>
        </div>

        {animatedTrace.length > 0 ? (
          <div className="space-y-2">
            {animatedTrace.map((item, i) => {
              const agent = agentLabels[item.agent] || agentLabels.cognitive_orchestrator;
              const colors = colorMap[agent.color] || colorMap.indigo;
              const isActive = item.status === "thinking" || item.status === "analyzing" || item.status === "searching";
              const isDone = item.status === "done";

              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-500
                    ${isActive ? `${colors.bg} ${colors.border} shadow-md` : ""}
                    ${isDone ? `${colors.bg} ${colors.border} opacity-70` : ""}
                    ${!isActive && !isDone ? "bg-gray-50 border-gray-200" : ""}`}
                >
                  <div className="flex-shrink-0">
                    {isActive ? (
                      <div className={`w-5 h-5 rounded-full ${colors.dot} animate-ping opacity-75`}></div>
                    ) : isDone ? (
                      <div className={`w-5 h-5 rounded-full ${colors.dot} flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className={`w-5 h-5 rounded-full ${colors.dot} opacity-40`}></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isActive ? colors.text : "text-gray-500"}`}>
                      {item.label}
                    </p>
                    {item.detail && (
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.detail}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400">{isZh ? "等待用户输入..." : "Waiting for input..."}</p>
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
            <p className="font-medium text-gray-700 text-sm">{profile.name || (isZh ? "匿名用户" : "Anonymous")}</p>
            <p className="text-xs text-gray-400">{profile.cultural_bg || "unknown"}</p>
          </div>
        </div>
      </div>

      {/* 小熊状态 */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-2 font-medium">{isZh ? "小熊状态" : "Bear Status"}</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{bear.emoji}</span>
          <span className={`text-sm font-medium ${emotion.text}`}>
            {isZh ? bear.zh : bear.en}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>PHQ-2</span>
              <span>{profile.phq2_score}/6</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all" style={{ width: `${(profile.phq2_score / 6) * 100}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>GAD-2</span>
              <span>{profile.gad2_score}/6</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all" style={{ width: `${(profile.gad2_score / 6) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 流程进度（可点击导航） */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-3 font-medium">{isZh ? "咨询流程" : "Progress"}</p>
        <div className="space-y-2">
          {phases.map((phase, i) => {
            const isActive = i === currentPhaseIdx;
            const isDone = i < currentPhaseIdx;
            return (
              <button
                key={phase.key}
                onClick={() => onNavigate(phase.key)}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all hover:bg-gray-50 ${
                  isActive ? "bg-indigo-50" : ""
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  isActive ? "bg-indigo-500 text-white" : isDone ? "bg-green-400 text-white" : "bg-gray-200 text-gray-400"
                }`}>
                  {isDone ? "✓" : i + 1}
                </div>
                <span className={`text-sm ${isActive ? "text-indigo-600 font-medium" : isDone ? "text-green-600" : "text-gray-400"}`}>
                  {isZh ? phase.label : phase.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 新建会话 */}
      <div className="mt-auto px-5 py-4 border-t border-gray-100">
        <button onClick={onNewSession} className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 transition-all">
          ➕ {isZh ? "新建会话" : "New Session"}
        </button>
      </div>
    </div>
  );
}
