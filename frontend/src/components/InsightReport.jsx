import { useState, useEffect, useRef } from "react";
import { generateReport, generateReportStream } from "../utils/api";

export default function InsightReport({ report, state, onNavigate, onGoNext, language, sessionId, onReportGenerated }) {
  const isZh = language === "zh";
  const profile = state?.profile || {};
  const [generating, setGenerating] = useState(false);
  const [localReport, setLocalReport] = useState(report);
  // V5: SSE 流式状态
  const [sections, setSections] = useState({});
  const [streamProgress, setStreamProgress] = useState(0);
  const sseRef = useRef(null);

  // V5: 优先使用 SSE 流式生成
  useEffect(() => {
    if ((!localReport || Object.keys(localReport).length === 0) && sessionId && !generating) {
      setGenerating(true);
      setStreamProgress(0);

      // 尝试 SSE 流式
      sseRef.current = generateReportStream(
        sessionId,
        // onSection
        (name, data) => {
          setSections(prev => ({ ...prev, [name]: data }));
          setStreamProgress(prev => prev + 1);
        },
        // onComplete
        (fullReport) => {
          setLocalReport(fullReport);
          setSections({});
          if (onReportGenerated) onReportGenerated(fullReport);
          setGenerating(false);
        },
        // onError
        (err) => {
          console.error("[SSE] Report stream error:", err);
          // 降级到普通 API
          generateReport(sessionId).then(data => {
            if (data.report) {
              setLocalReport(data.report);
              if (onReportGenerated) onReportGenerated(data.report);
            }
          }).catch(console.error).finally(() => setGenerating(false));
        }
      );
    }

    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, [sessionId]);

  // 同步外部 report
  useEffect(() => {
    if (report && Object.keys(report).length > 0) setLocalReport(report);
  }, [report]);

  // V5: 骨架屏（SSE 流式进度）
  if (generating && (!localReport || Object.keys(localReport).length === 0)) {
    const sectionNames = ["bear_status", "what_happened", "why_this_happens", "what_i_need", "bear_message", "u_curve_info"];
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#3a2a1a] mb-2">{isZh ? "🪞 正在生成你的报告..." : "🪞 Generating your report..."}</h1>
          <p className="text-[#6a5a4a]">{isZh ? "Panda 正在分析你的分享，请稍候" : "Panda is analyzing your sharing"}</p>
        </div>

        {/* SSE 进度指示 */}
        <div className="flex justify-center gap-2 mb-6">
          {sectionNames.map((name, i) => (
            <div key={name} className={`w-3 h-3 rounded-full transition-all duration-300 ${sections[name] ? "bg-green-400" : i <= streamProgress ? "bg-amber-400 animate-pulse" : "bg-gray-200"}`} />
          ))}
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
      </div>
    );
  }

  const bearStatus = localReport?.bear_status || {};
  const whatHappened = localReport?.what_happened || {};
  const whyThisHappens = localReport?.why_this_happens || {};
  const whatINeed = localReport?.what_i_need || {};
  const uCurveInfo = localReport?.u_curve_info || {};

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
          {/* V5: PERMA 能量 */}
          {profile.perma_energy !== undefined && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{Math.round((profile.perma_energy || 0.5) * 100)}%</div>
              <p className="text-xs text-[#8a7a6a]">PERMA</p>
            </div>
          )}
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

      {/* V5 模块3：双视角分析（为什么会这样） */}
      <div className="bg-white rounded-2xl p-6 mb-4 border border-[#e8ddd0] shadow-sm">
        <h3 className="text-lg font-bold text-[#3a2a1a] mb-4">🧠 {isZh ? "为什么会这样" : "Why This Happens"}</h3>

        {/* V5: 东方视角 */}
        {whyThisHappens.eastern_view && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm font-semibold text-amber-800 mb-2">🏮 {isZh ? "东方视角" : "Eastern Perspective"}</p>
            {whyThisHappens.eastern_view.mechanisms?.map((m, i) => <p key={i} className="text-[#5a4a3a] mb-1 text-sm">• {m}</p>)}
            {whyThisHappens.eastern_view.interpretation && <p className="text-sm text-[#6a5a4a] mt-2 italic">{whyThisHappens.eastern_view.interpretation}</p>}
          </div>
        )}

        {/* V5: 西方视角 */}
        {whyThisHappens.western_view && (
          <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-2">🌐 {isZh ? "西方视角" : "Western Perspective"}</p>
            {whyThisHappens.western_view.mechanisms?.map((m, i) => <p key={i} className="text-[#5a4a3a] mb-1 text-sm">• {m}</p>)}
            {whyThisHappens.western_view.interpretation && <p className="text-sm text-[#6a5a4a] mt-2 italic">{whyThisHappens.western_view.interpretation}</p>}
          </div>
        )}

        {/* V5: 综合理解 */}
        {whyThisHappens.synthesis && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-blue-50 border border-purple-200">
            <p className="text-sm font-semibold text-purple-800 mb-1">🔮 {isZh ? "综合理解" : "Synthesis"}</p>
            <p className="text-[#5a4a3a] text-sm">{whyThisHappens.synthesis}</p>
          </div>
        )}

        {/* 兼容 V4 格式 */}
        {!whyThisHappens.eastern_view && whyThisHappens.psychological_mechanisms?.length > 0 && (
          <div>
            <p className="text-xs text-[#8a7a6a] mb-2">{isZh ? "心理机制" : "Mechanisms"}</p>
            {whyThisHappens.psychological_mechanisms.map((m, i) => <p key={i} className="text-[#5a4a3a] mb-1">• {m}</p>)}
          </div>
        )}
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

      {/* V5: U 型曲线信息 */}
      {uCurveInfo.stage && uCurveInfo.stage !== "unknown" && (
        <div className="bg-white rounded-2xl p-6 mb-4 border border-[#e8ddd0] shadow-sm">
          <h3 className="text-lg font-bold text-[#3a2a1a] mb-3">📈 {isZh ? "你的文化适应曲线" : "Your Cultural Adaptation Curve"}</h3>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">{uCurveInfo.stage}</span>
            {uCurveInfo.description && <p className="text-[#5a4a3a] text-sm">{uCurveInfo.description}</p>}
          </div>
          {uCurveInfo.tip && <p className="text-sm text-[#8a7a6a] italic">💡 {uCurveInfo.tip}</p>}
        </div>
      )}

      {/* 小熊寄语 */}
      {localReport?.bear_message && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-6 border border-amber-200">
          <h3 className="text-lg font-bold text-[#3a2a1a] mb-3">🐻 {isZh ? "小熊寄语" : "Bear's Message"}</h3>
          <p className="text-[#5a4a3a] leading-relaxed">{localReport.bear_message}</p>
        </div>
      )}

      {/* 超链接 */}
      <div className="bg-white rounded-2xl p-6 border border-[#e8ddd0] shadow-sm text-center">
        <p className="text-[#5a4a3a] mb-4">
          {isZh ? "现在，是时候照顾一下自己了。点击「一起练习」，体验 PERMA 积极心理养成。" : "Now it's time to take care of yourself."}
        </p>
        <button onClick={onGoNext}
          className="px-8 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all">
          {isZh ? "点击「一起练习」→" : "Click 'Practice Together' →"}
        </button>
      </div>
    </div>
  );
}
