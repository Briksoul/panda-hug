export default function InsightReport({ report, language }) {
  const isZh = language === "zh";

  if (!report || Object.keys(report).length === 0) return null;

  const bearStatus = report.bear_status || {};
  const whatHappened = report.what_happened || {};
  const whyThisHappens = report.why_this_happens || {};
  const whatINeed = report.what_i_need || {};

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 shadow-sm">
      {/* 标题 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          {isZh ? "🪞 你的心理洞察报告" : "🪞 Your Insight Report"}
        </h2>
        <p className="text-sm text-gray-500">
          {isZh ? "基于你的分享，为你生成的专属分析" : "Personalized analysis based on your sharing"}
        </p>
      </div>

      {/* 模块1：我的状态 */}
      <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>{bearStatus.emoji || "🐻"}</span>
          {isZh ? "我的状态" : "My Status"}
        </h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{bearStatus.emoji || "🐻"}</span>
          <div>
            <p className="font-medium text-gray-800">{bearStatus.label || (isZh ? "小熊" : "Bear")}</p>
            <p className="text-sm text-gray-500">{bearStatus.description || ""}</p>
          </div>
        </div>
      </div>

      {/* 模块2：最近发生了什么 */}
      {whatHappened.timeline && whatHappened.timeline.length > 0 && (
        <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            📋 {isZh ? "最近发生了什么" : "What Happened"}
          </h3>
          <div className="space-y-2">
            {whatHappened.timeline.map((event, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">{event}</p>
              </div>
            ))}
          </div>
          {whatHappened.summary && (
            <p className="mt-3 text-sm text-gray-500 italic">{whatHappened.summary}</p>
          )}
        </div>
      )}

      {/* 模块3：为什么会这样 */}
      <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          🧠 {isZh ? "为什么会这样" : "Why This Happens"}
        </h3>
        {whyThisHappens.psychological_mechanisms && whyThisHappens.psychological_mechanisms.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1">{isZh ? "心理机制" : "Psychological Mechanisms"}</p>
            {whyThisHappens.psychological_mechanisms.map((mech, i) => (
              <p key={i} className="text-sm text-gray-600 mb-1">• {mech}</p>
            ))}
          </div>
        )}
        {whyThisHappens.cultural_influence && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1">{isZh ? "文化影响" : "Cultural Influence"}</p>
            <p className="text-sm text-gray-600">{whyThisHappens.cultural_influence}</p>
          </div>
        )}
        {whyThisHappens.explanation && (
          <p className="text-sm text-gray-500 italic">{whyThisHappens.explanation}</p>
        )}
      </div>

      {/* 模块4：我真正需要什么 */}
      {whatINeed.core_needs && whatINeed.core_needs.length > 0 && (
        <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            💝 {isZh ? "我真正需要什么" : "What I Really Need"}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {whatINeed.core_needs.map((need, i) => (
              <span key={i} className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm">
                {need}
              </span>
            ))}
          </div>
          {whatINeed.suggestions && whatINeed.suggestions.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">{isZh ? "建议" : "Suggestions"}</p>
              {whatINeed.suggestions.map((sug, i) => (
                <p key={i} className="text-sm text-gray-600 mb-1">• {sug}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 模块5：小熊寄语 */}
      {report.bear_message && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            🐻 {isZh ? "小熊寄语" : "Bear's Message"}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{report.bear_message}</p>
        </div>
      )}

      {/* 训练推荐 */}
      {report.training_recommendation && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 mb-2">{report.training_recommendation}</p>
        </div>
      )}
    </div>
  );
}
