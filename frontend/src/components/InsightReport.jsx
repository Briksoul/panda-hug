export default function InsightReport({ report, state, onNavigate, onGoNext, language }) {
  const isZh = language === "zh";
  const profile = state?.profile || {};

  // #2 骨架屏 — 报告生成中
  if (!report || Object.keys(report).length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#3a2a1a] mb-2">{isZh ? "🪞 正在生成你的报告..." : "🪞 Generating your report..."}</h1>
          <p className="text-[#6a5a4a]">{isZh ? "Panda 正在分析你的分享，请稍候" : "Panda is analyzing your sharing"}</p>
        </div>
        {/* 骨架屏 */}
        <div className="space-y-4 animate-pulse">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-[#e8ddd0]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="h-5 w-32 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
                <div className="h-4 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <div className="flex justify-center gap-2">
            {[0,1,2].map(i => <span key={i} className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: `${i*0.3}s` }} />)}
          </div>
        </div>
      </div>
    );
  }

  const bearStatus = report.bear_status || {};
  const whatHappened = report.what_happened || {};
  const whyThisHappens = report.why_this_happens || {};
  const whatINeed = report.what_i_need || {};

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#3a2a1a] mb-2">{isZh ? "🪞 你的心理洞察报告" : "🪞 Your Insight Report"}</h1>
        <p className="text-[#6a5a4a]">{isZh ? "基于你的分享，为你生成的专属分析" : "Personalized analysis based on your sharing"}</p>
      </div>

      {/* 模块1：我的状态 */}
      <div className="bg-white rounded-2xl p-6 mb-4 border border-[#e8ddd0] shadow-sm">
        <h3 className="text-lg font-bold text-[#3a2a1a] mb-4 flex items-center gap-2">
          <span className="text-2xl">{bearStatus.emoji || "🐻"}</span> {isZh ? "我的状态" : "My Status"}
        </h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">{bearStatus.emoji || "🐻"}</div>
          <div>
            <p className="text-xl font-bold text-[#3a2a1a]">{bearStatus.label || ""}</p>
            <p className="text-[#6a5a4a]">{bearStatus.description || ""}</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center"><div className="text-2xl font-bold text-amber-500">{profile.phq2_score || 0}</div><p className="text-xs text-[#8a7a6a]">PHQ-2</p></div>
          <div className="text-center"><div className="text-2xl font-bold text-blue-500">{profile.gad2_score || 0}</div><p className="text-xs text-[#8a7a6a]">GAD-2</p></div>
        </div>
      </div>

      {/* 模块2：最近发生了什么 */}
      {whatHappened.timeline?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-4 border border-[#e8ddd0] shadow-sm">
          <h3 className="text-lg font-bold text-[#3a2a1a] mb-4">📋 {isZh ? "最近发生了什么" : "What Happened"}</h3>
          <div className="space-y-3">
            {whatHappened.timeline.map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                <p className="text-[#5a4a3a]">{e}</p>
              </div>
            ))}
          </div>
          {whatHappened.summary && <p className="mt-4 text-sm text-[#8a7a6a] italic">{whatHappened.summary}</p>}
        </div>
      )}

      {/* 模块3：为什么会这样 */}
      <div className="bg-white rounded-2xl p-6 mb-4 border border-[#e8ddd0] shadow-sm">
        <h3 className="text-lg font-bold text-[#3a2a1a] mb-4">🧠 {isZh ? "为什么会这样" : "Why This Happens"}</h3>
        {whyThisHappens.psychological_mechanisms?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-[#8a7a6a] mb-2">{isZh ? "心理机制" : "Mechanisms"}</p>
            {whyThisHappens.psychological_mechanisms.map((m, i) => <p key={i} className="text-[#5a4a3a] mb-1">• {m}</p>)}
          </div>
        )}
        {whyThisHappens.cultural_influence && (
          <div className="mb-4">
            <p className="text-xs text-[#8a7a6a] mb-2">{isZh ? "文化影响" : "Cultural Influence"}</p>
            <p className="text-[#5a4a3a]">{whyThisHappens.cultural_influence}</p>
          </div>
        )}
        {whyThisHappens.explanation && <p className="text-sm text-[#8a7a6a] italic">{whyThisHappens.explanation}</p>}
      </div>

      {/* 模块4：我真正需要什么 */}
      {whatINeed.core_needs?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-4 border border-[#e8ddd0] shadow-sm">
          <h3 className="text-lg font-bold text-[#3a2a1a] mb-4">💝 {isZh ? "我真正需要什么" : "What I Really Need"}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {whatINeed.core_needs.map((n, i) => <span key={i} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">{n}</span>)}
          </div>
          {whatINeed.suggestions?.length > 0 && (
            <div>
              <p className="text-xs text-[#8a7a6a] mb-2">{isZh ? "建议" : "Suggestions"}</p>
              {whatINeed.suggestions.map((s, i) => <p key={i} className="text-[#5a4a3a] mb-1">• {s}</p>)}
            </div>
          )}
        </div>
      )}

      {/* 模块5：小熊寄语 */}
      {report.bear_message && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-6 border border-amber-200">
          <h3 className="text-lg font-bold text-[#3a2a1a] mb-3">🐻 {isZh ? "小熊寄语" : "Bear's Message"}</h3>
          <p className="text-[#5a4a3a] leading-relaxed">{report.bear_message}</p>
        </div>
      )}

      {/* 超链接 */}
      <div className="bg-white rounded-2xl p-6 border border-[#e8ddd0] shadow-sm text-center">
        <p className="text-[#5a4a3a] mb-4">
          {isZh ? "现在，是时候照顾一下自己了。点击「一起练习」，体验融合东西方心理智慧的放松训练。" : "Now it's time to take care of yourself."}
        </p>
        <button onClick={onGoNext}
          className="px-8 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all">
          {isZh ? "点击「一起练习」→" : "Click 'Practice Together' →"}
        </button>
      </div>
    </div>
  );
}
