const agentLabels = {
  triage: { name: "初筛接待", emoji: "🐼", color: "text-indigo-500" },
  cultural: { name: "文化分析", emoji: "🧠", color: "text-purple-500" },
  coach: { name: "心理训练", emoji: "🧘", color: "text-cyan-500" },
  crisis: { name: "危机守护", emoji: "🛡️", color: "text-red-500" },
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
  { key: "cultural", label: "文化分析" },
  { key: "coach", label: "心理训练" },
];

export default function Sidebar({ state, onNewSession }) {
  if (!state) return null;

  const profile = state.profile || {};
  const currentAgent = agentLabels[state.current_agent] || agentLabels.triage;
  const emotion = emotionColors[profile.emotion_level] || emotionColors.mild;
  const currentPhaseIdx = phases.findIndex((p) => p.key === state.phase);

  return (
    <div className="w-72 h-screen bg-white/90 backdrop-blur-sm border-r border-gray-100 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐼</span>
          <span className="font-bold text-gray-700 text-lg">PANDA</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">温暖跨文化心理伴侣</p>
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

        {/* 量表分数 */}
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>PHQ-2 (抑郁)</span>
              <span>{profile.phq2_score}/6</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all"
                style={{ width: `${(profile.phq2_score / 6) * 100}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>GAD-2 (焦虑)</span>
              <span>{profile.gad2_score}/6</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all"
                style={{ width: `${(profile.gad2_score / 6) * 100}%` }}
              ></div>
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
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : isDone
                      ? "bg-green-400 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <span
                  className={`text-sm ${
                    isActive ? "text-indigo-600 font-medium" : isDone ? "text-green-600" : "text-gray-400"
                  }`}
                >
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
          <span className="text-lg">{currentAgent.emoji}</span>
          <span className={`text-sm font-medium ${currentAgent.color}`}>
            {currentAgent.name}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">对话轮次：{profile.turns || 0}</p>
      </div>

      {/* 新建会话 */}
      <div className="mt-auto px-5 py-4 border-t border-gray-100">
        <button
          onClick={onNewSession}
          className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 transition-all"
        >
          ➕ 新建会话
        </button>
      </div>
    </div>
  );
}
