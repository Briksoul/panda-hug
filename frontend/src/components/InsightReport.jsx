export default function InsightReport({ report }) {
  if (!report || Object.keys(report).length === 0) return null;

  const bearStatus = report.bear_status || {};
  const whatHappened = report.what_happened || {};
  const whyThisHappens = report.why_this_happens || {};
  const whatINeed = report.what_i_need || {};
  const bearMessage = report.bear_message || "";
  const trainingRec = report.training_recommendation || "";

  return (
    <div className="mx-4 my-4 space-y-3">
      {/* 报告标题 */}
      <div className="text-center py-3">
        <h3 className="text-lg font-bold text-gray-700">📊 心理情绪洞察报告</h3>
        <p className="text-xs text-gray-400 mt-1">基于你的咨询数据生成</p>
      </div>

      {/* 模块1: 我的状态 */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{bearStatus.emoji || "🐻"}</span>
          <h4 className="font-semibold text-indigo-700 text-sm">{bearStatus.label || "状态"}</h4>
        </div>
        <p className="text-sm text-gray-600">{bearStatus.description}</p>
      </div>

      {/* 模块2: 我最近发生了什么 */}
      {whatHappened.timeline && whatHappened.timeline.length > 0 && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <h4 className="font-semibold text-purple-700 text-sm mb-3">📝 我最近发生了什么</h4>
          <div className="space-y-2">
            {whatHappened.timeline.map((event, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">{event}</p>
              </div>
            ))}
          </div>
          {whatHappened.summary && (
            <p className="text-xs text-gray-500 mt-3 italic">{whatHappened.summary}</p>
          )}
        </div>
      )}

      {/* 模块3: 我为什么会这样 */}
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
        <h4 className="font-semibold text-cyan-700 text-sm mb-3">🧠 我为什么会这样</h4>
        {whyThisHappens.psychological_mechanisms && whyThisHappens.psychological_mechanisms.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1">心理机制</p>
            {whyThisHappens.psychological_mechanisms.map((m, i) => (
              <p key={i} className="text-sm text-gray-600">• {m}</p>
            ))}
          </div>
        )}
        {whyThisHappens.cultural_influence && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1">文化影响</p>
            <p className="text-sm text-gray-600">{whyThisHappens.cultural_influence}</p>
          </div>
        )}
        {whyThisHappens.explanation && (
          <p className="text-sm text-gray-700 leading-relaxed">{whyThisHappens.explanation}</p>
        )}
      </div>

      {/* 模块5: 我真正需要什么 */}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <h4 className="font-semibold text-green-700 text-sm mb-3">💚 我真正需要什么</h4>
        {whatINeed.core_needs && whatINeed.core_needs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {whatINeed.core_needs.map((need, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-green-200 text-green-800 text-xs">
                {need}
              </span>
            ))}
          </div>
        )}
        {whatINeed.suggestions && whatINeed.suggestions.map((s, i) => (
          <p key={i} className="text-sm text-gray-600">• {s}</p>
        ))}
      </div>

      {/* 模块6: 小熊寄语 */}
      {bearMessage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <span className="text-2xl">🐻</span>
            <div>
              <h4 className="font-semibold text-amber-700 text-sm mb-2">小熊寄语</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{bearMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* 模块7: 训练推荐 */}
      {trainingRec && (
        <div className="rounded-2xl border border-pink-200 bg-pink-50 p-4 text-center">
          <p className="text-sm text-gray-700 mb-2">🧘 {trainingRec}</p>
          <p className="text-xs text-gray-500">回复"开始训练"即可进入</p>
        </div>
      )}
    </div>
  );
}
