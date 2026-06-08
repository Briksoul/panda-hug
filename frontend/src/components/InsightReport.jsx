export default function InsightReport({ report, state, onNavigate, onGoNext, language }) {
  const isZh = language === "zh";
  const profile = state?.profile || {};

  if (!report || Object.keys(report).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #F5EDE3, #F2E6D9)" }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🐼</div>
          <h2 className="text-2xl font-bold text-[#4A3A2A] mb-2">{isZh ? "正在为你生成报告..." : "Generating report..."}</h2>
          <p className="text-[#6B5B4B] mb-6">{isZh ? "请先完成情绪识别和倾诉陪伴" : "Please complete Emotion Check and Confiding first"}</p>
          <button onClick={() => onNavigate("counseling")}
            className="px-6 py-2.5 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all"
            style={{ background: "linear-gradient(135deg, #5B8DEF, #7B5BF0)" }}>
            {isZh ? "去倾诉陪伴" : "Go to Confiding"}
          </button>
        </div>
      </div>
    );
  }

  const bearStatus = report.bear_status || {};
  const whatHappened = report.what_happened || {};
  const whyThisHappens = report.why_this_happens || {};
  const whatINeed = report.what_i_need || {};

  const cardStyle = { background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #F5EDE3, #F2E6D9)" }}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#4A3A2A] mb-2">{isZh ? "🪞 你的心理洞察报告" : "🪞 Your Insight Report"}</h1>
          <p className="text-[#6B5B4B]">{isZh ? "基于你的分享，为你生成的专属分析" : "Personalized analysis based on your sharing"}</p>
        </div>

        {/* 模块1 */}
        <div className="rounded-2xl p-6 mb-5 border border-white/60" style={cardStyle}>
          <h3 className="text-lg font-bold text-[#4A3A2A] mb-4 flex items-center gap-2">
            <span className="text-2xl">{bearStatus.emoji || "🐻"}</span> {isZh ? "我的状态" : "My Status"}
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl">{bearStatus.emoji || "🐻"}</div>
            <div>
              <p className="text-xl font-bold text-[#4A3A2A]">{bearStatus.label || ""}</p>
              <p className="text-[#6B5B4B]">{bearStatus.description || ""}</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center"><div className="text-2xl font-bold text-amber-500">{profile.phq2_score || 0}</div><p className="text-xs text-[#A89888]">PHQ-2</p></div>
            <div className="text-center"><div className="text-2xl font-bold text-blue-500">{profile.gad2_score || 0}</div><p className="text-xs text-[#A89888]">GAD-2</p></div>
          </div>
        </div>

        {/* 模块2 */}
        {whatHappened.timeline?.length > 0 && (
          <div className="rounded-2xl p-6 mb-5 border border-white/60" style={cardStyle}>
            <h3 className="text-lg font-bold text-[#4A3A2A] mb-4">📋 {isZh ? "最近发生了什么" : "What Happened"}</h3>
            <div className="space-y-3">
              {whatHappened.timeline.map((e, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                  <p className="text-[#5A4A3A]">{e}</p>
                </div>
              ))}
            </div>
            {whatHappened.summary && <p className="mt-4 text-sm text-[#A89888] italic">{whatHappened.summary}</p>}
          </div>
        )}

        {/* 模块3 */}
        <div className="rounded-2xl p-6 mb-5 border border-white/60" style={cardStyle}>
          <h3 className="text-lg font-bold text-[#4A3A2A] mb-4">🧠 {isZh ? "为什么会这样" : "Why This Happens"}</h3>
          {whyThisHappens.psychological_mechanisms?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-[#A89888] mb-2">{isZh ? "心理机制" : "Mechanisms"}</p>
              {whyThisHappens.psychological_mechanisms.map((m, i) => <p key={i} className="text-[#5A4A3A] mb-1">• {m}</p>)}
            </div>
          )}
          {whyThisHappens.cultural_influence && (
            <div className="mb-4">
              <p className="text-xs text-[#A89888] mb-2">{isZh ? "文化影响" : "Cultural Influence"}</p>
              <p className="text-[#5A4A3A]">{whyThisHappens.cultural_influence}</p>
            </div>
          )}
          {whyThisHappens.explanation && <p className="text-sm text-[#A89888] italic">{whyThisHappens.explanation}</p>}
        </div>

        {/* 模块4 */}
        {whatINeed.core_needs?.length > 0 && (
          <div className="rounded-2xl p-6 mb-5 border border-white/60" style={cardStyle}>
            <h3 className="text-lg font-bold text-[#4A3A2A] mb-4">💝 {isZh ? "我真正需要什么" : "What I Really Need"}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {whatINeed.core_needs.map((n, i) => (
                <span key={i} className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: "rgba(159,122,234,0.1)", color: "#6B46C1" }}>{n}</span>
              ))}
            </div>
            {whatINeed.suggestions?.length > 0 && (
              <div>
                <p className="text-xs text-[#A89888] mb-2">{isZh ? "建议" : "Suggestions"}</p>
                {whatINeed.suggestions.map((s, i) => <p key={i} className="text-[#5A4A3A] mb-1">• {s}</p>)}
              </div>
            )}
          </div>
        )}

        {/* 模块5 */}
        {report.bear_message && (
          <div className="rounded-2xl p-6 mb-8 border border-amber-200/60" style={{ background: "linear-gradient(135deg, rgba(255,243,212,0.5), rgba(255,228,160,0.3))" }}>
            <h3 className="text-lg font-bold text-[#4A3A2A] mb-3">🐻 {isZh ? "小熊寄语" : "Bear's Message"}</h3>
            <p className="text-[#5A4A3A] leading-relaxed">{report.bear_message}</p>
          </div>
        )}

        {/* 超链接 */}
        <div className="rounded-2xl p-6 border border-white/60 text-center" style={cardStyle}>
          <p className="text-[#5A4A3A] mb-4">
            {isZh ? "现在，是时候照顾一下自己了。点击「一起练习」，体验融合东西方心理智慧的放松训练。" : "Now it's time to take care of yourself."}
          </p>
          <button onClick={onGoNext}
            className="px-8 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            style={{ background: "linear-gradient(135deg, #38B2AC, #319795)" }}>
            {isZh ? "点击「一起练习」→" : "Click 'Practice Together' →"}
          </button>
        </div>
      </div>
    </div>
  );
}
