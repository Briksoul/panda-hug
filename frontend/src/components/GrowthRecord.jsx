const statusStyles = {
  "需要守护": "bg-red-100 text-red-700 border-red-200",
  "有些低落": "bg-orange-100 text-orange-700 border-orange-200",
  "略显疲惫": "bg-amber-100 text-amber-700 border-amber-200",
  "比较平静": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "充满活力": "bg-green-100 text-green-700 border-green-200",
  "暂无记录": "bg-gray-50 text-gray-400 border-gray-100",
};

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function MetricCard({ label, value, unit }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-700">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-gray-400">{unit}</span>}
      </p>
    </div>
  );
}

function EmotionTrend({ data }) {
  if (!data?.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
        完成几次对话后，这里会出现情绪变化趋势
      </div>
    );
  }

  const width = 760;
  const height = 190;
  const padding = 24;
  const points = data.map((item, index) => {
    const x = data.length === 1
      ? width / 2
      : padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (item.distress_index / 100) * (height - padding * 2);
    return { ...item, x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-52 w-full overflow-visible"
        role="img"
        aria-label="文本情绪困扰指数趋势"
      >
        {[25, 50, 75].map((level) => {
          const y = height - padding - (level / 100) * (height - padding * 2);
          return (
            <g key={level}>
              <line
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4 6"
              />
              <text x={0} y={y + 4} fontSize="10" fill="#9ca3af">{level}</text>
            </g>
          );
        })}
        <polyline
          points={polyline}
          fill="none"
          stroke="#6366f1"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <circle
            key={`${point.timestamp}-${index}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#ffffff"
            stroke="#6366f1"
            strokeWidth="3"
          >
            <title>{`${formatDate(point.date)}：${point.distress_index}`}</title>
          </circle>
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-400">
        <span>{formatDate(data[0].date)}</span>
        <span className="text-right">{formatDate(data[data.length - 1].date)}</span>
        <span className="col-span-2 text-center text-[10px] sm:text-xs">
          困扰指数越低，表示整体状态越平稳
        </span>
      </div>
    </div>
  );
}

const permaLabels = {
  positive_emotion: "积极情绪",
  engagement: "投入",
  relationships: "关系",
  meaning: "意义",
  accomplishment: "成就",
};

function PermaRadar({ dimensions }) {
  const entries = Object.keys(permaLabels).map((key) => ({
    key,
    label: permaLabels[key],
    value: Number(dimensions?.[key] ?? 50),
  }));
  const center = 120;
  const radius = 78;
  const pointAt = (index, value) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / entries.length;
    const distance = radius * (value / 100);
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    };
  };
  const outerPoints = entries.map((_, index) => pointAt(index, 100));
  const valuePoints = entries.map((entry, index) => pointAt(index, entry.value));

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[260px_1fr]">
      <svg
        viewBox="0 0 240 240"
        className="mx-auto aspect-square h-auto w-full max-w-64"
        role="img"
        aria-label="PERMA 五维幸福感信号"
      >
        {[25, 50, 75, 100].map((level) => (
          <polygon
            key={level}
            points={entries.map((_, index) => {
              const point = pointAt(index, level);
              return `${point.x},${point.y}`;
            }).join(" ")}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        {outerPoints.map((point, index) => (
          <line
            key={entries[index].key}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="#e5e7eb"
          />
        ))}
        <polygon
          points={valuePoints.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="#c7d2fe"
          fillOpacity="0.55"
          stroke="#6366f1"
          strokeWidth="2"
        />
        {valuePoints.map((point, index) => (
          <circle key={entries[index].key} cx={point.x} cy={point.y} r="3" fill="#4f46e5" />
        ))}
      </svg>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.key}>
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>{entry.label}</span>
              <span>{entry.value.toFixed(1)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-indigo-400" style={{ width: `${entry.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdaptationCurve({ data }) {
  const points = data?.curve_points || [];
  if (!points.length) return null;
  const width = 700;
  const height = 190;
  const padding = 28;
  const scalePoint = (point) => ({
    x: padding + (point.month / 30) * (width - padding * 2),
    y: height - padding - (point.wellbeing_index / 100) * (height - padding * 2),
  });
  const scaled = points.map((point) => ({ ...point, ...scalePoint(point) }));
  const current = scalePoint(data.current || { month: 0, wellbeing_index: 50 });

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" role="img" aria-label="跨文化适应 U 型曲线">
        {[25, 50, 75].map((level) => {
          const y = height - padding - (level / 100) * (height - padding * 2);
          return (
            <line
              key={level}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="4 6"
            />
          );
        })}
        <polyline
          points={scaled.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={current.x} cy={current.y} r="7" fill="#4f46e5" stroke="white" strokeWidth="3" />
        {[0, 6, 12, 18, 24, 30].map((month) => {
          const x = padding + (month / 30) * (width - padding * 2);
          return (
            <text key={month} x={x} y={height - 5} textAnchor="middle" fontSize="10" fill="#9ca3af">
              {month}月
            </text>
          );
        })}
      </svg>
      <div className="rounded-xl bg-violet-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-violet-800">{data.label}</p>
          <span className="text-xs text-violet-500">
            {data.source === "cultural_agent" ? "Cultural Agent 校正" : "按时长与量表估算"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{data.description}</p>
        <p className="mt-2 text-xs text-violet-600">建议：{data.tip}</p>
      </div>
    </div>
  );
}

export default function GrowthRecord({ data, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="text-5xl breathe-animation">🐼</div>
          <p className="mt-3 text-sm text-gray-400">正在整理你的成长记录...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <button
          onClick={onRefresh}
          className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm text-white hover:bg-indigo-600"
        >
          重新加载成长记录
        </button>
      </div>
    );
  }

  const metrics = data.metrics || {};
  const level = data.interaction_level || {};
  const calendar = data.calendar || [];
  const issues = data.issue_distribution || [];
  const trainings = data.training_effects || [];
  const adaptationCurve = data.adaptation_curve || {};
  const perma = data.perma || {};
  const voiceInsights = data.voice_insights || {};
  const latestVoice = voiceInsights.latest;
  const maxIssueCount = Math.max(1, ...issues.map((item) => item.count));

  return (
    <main className="h-dvh flex-1 overflow-y-auto bg-gray-50/60">
      <div className="mx-auto max-w-6xl break-words px-4 py-8 pb-24 [overflow-wrap:anywhere] sm:px-6 lg:pb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-500">Growth Record</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-800">我的成长记录</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
              查看对话、训练与跨文化适应中逐步形成的长期变化。
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 hover:border-indigo-200 hover:text-indigo-600"
          >
            刷新
          </button>
        </div>

        {data.care_alert?.triggered && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            检测到连续多日情绪低落。建议尽快联系专业心理咨询师或医疗机构获得支持。
          </div>
        )}

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <MetricCard label="累计会话" value={metrics.session_count || 0} unit="次" />
          <MetricCard label="互动记录" value={metrics.interaction_count || 0} unit="轮" />
          <MetricCard label="声学分析" value={metrics.voice_analysis_count || 0} unit="次" />
          <MetricCard label="洞察报告" value={metrics.report_count || 0} unit="份" />
          <MetricCard label="完成训练" value={metrics.training_count || 0} unit="次" />
          <MetricCard label="陪伴时间" value={metrics.interaction_days || 1} unit="天" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="mb-4">
              <h2 className="font-semibold text-gray-700">跨文化适应 U 型曲线</h2>
              <p className="mt-1 text-xs text-gray-400">
                结合跨文化生活时长、量表结果与 Cultural Agent 判断
              </p>
            </div>
            <AdaptationCurve data={adaptationCurve} />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-700">PERMA 五维成长信号</h2>
                <p className="mt-1 text-xs text-gray-400">{perma.source}</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600">
                {perma.overall_score ?? 50}
              </span>
            </div>
            <PermaRadar dimensions={perma.dimensions} />
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-gray-700">对话情绪变化趋势</h2>
                <p className="mt-1 text-xs text-gray-400">
                  来源：
                  {data.data_sources?.text && "文本 "}
                  {data.data_sources?.voice && "语音转录 "}
                  {data.data_sources?.acoustic && "Hume 声学 "}
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-600">
                最近 {data.emotion_trend?.length || 0} 次
              </span>
            </div>
            <EmotionTrend data={data.emotion_trend} />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <p className="text-xs text-gray-400">我与小熊互动记</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl">
                🐼
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700">{level.label || "初识伙伴"}</p>
                <p className="text-xs text-gray-400">等级 {level.level || 1} · {level.range || "1–14天"}</p>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${Math.min(100, ((metrics.interaction_days || 1) / (level.next_at || metrics.interaction_days || 1)) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {level.next_at ? `陪伴到第 ${level.next_at} 天进入下一等级` : "你们已经成为深度伙伴"}
            </p>
          </div>
        </section>

        {latestVoice && (
          <section className="mt-6 rounded-2xl border border-violet-100 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-700">最近一次声学情绪分析</h2>
                <p className="mt-1 text-xs text-gray-400">{voiceInsights.disclaimer}</p>
              </div>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-600">
                Hume EVI
              </span>
            </div>
            <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
              “{latestVoice.transcript}”
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(latestVoice.top_emotions || []).map((emotion) => (
                <span
                  key={emotion.name}
                  className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs text-violet-700"
                >
                  {emotion.label} {Math.round(Number(emotion.score || 0) * 100)}%
                </span>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {Object.entries({
                distress: "困扰表达",
                anxiety: "焦虑表达",
                low_mood: "低落表达",
                arousal: "唤醒强度",
              }).map(([key, label]) => {
                const value = Number(latestVoice.psychological_signals?.[key] || 0);
                return (
                  <div key={key} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{label}</span>
                      <span>{Math.round(value * 100)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-violet-400"
                        style={{ width: `${Math.min(100, value * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {latestVoice.text_voice_incongruent && (
              <p className="mt-3 text-xs text-amber-600">
                本次语义与声学表达存在差异，系统将其作为需要继续了解的信号，而不是直接下结论。
              </p>
            )}
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="font-semibold text-gray-700">近期日历</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {calendar.slice(-21).map((entry) => (
              <div
                key={entry.date}
                className={`rounded-xl border p-3 ${statusStyles[entry.bear_status] || statusStyles["暂无记录"]}`}
              >
                <p className="text-xs font-medium">{formatDate(entry.date)}</p>
                <p className="mt-2 text-xs">{entry.bear_status}</p>
                {entry.average_distress != null && (
                  <p className="mt-1 text-[10px] opacity-70">指数 {entry.average_distress}</p>
                )}
                {(entry.report_count > 0 || entry.training_count > 0) && (
                  <p className="mt-2 text-[10px] opacity-70">
                    报告 {entry.report_count} · 训练 {entry.training_count}
                  </p>
                )}
              </div>
            ))}
            {calendar.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-gray-400">
                还没有足够的日历记录
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 className="font-semibold text-gray-700">高频问题来源</h2>
            <div className="mt-4 space-y-3">
              {issues.map((item) => (
                <div key={item.category}>
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>{item.category}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-violet-400"
                      style={{ width: `${(item.count / maxIssueCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {issues.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">继续交流后会形成议题分布</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 className="font-semibold text-gray-700">训练效果记录</h2>
            <div className="mt-4 space-y-3">
              {trainings.slice(-6).reverse().map((training, index) => (
                <div key={`${training.date}-${index}`} className="rounded-xl bg-cyan-50 p-3">
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-medium text-cyan-800">{training.technique || "心理训练"}</p>
                    <p className="text-xs text-cyan-500">{formatDate(training.date)}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {training.improvement || training.user_feedback || "已完成训练"}
                  </p>
                  {training.before?.distress_index != null && training.after?.distress_index != null && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>训练前 {training.before.distress_index}</span>
                        <span className={training.distress_change > 0 ? "text-green-600" : "text-gray-400"}>
                          {training.distress_change > 0
                            ? `改善 ${training.distress_change}`
                            : "暂未检测到下降"}
                        </span>
                        <span>训练后 {training.after.distress_index}</span>
                      </div>
                      <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-cyan-100">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-cyan-500"
                          style={{ width: `${training.after.distress_index}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {trainings.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">完成 Coach 训练后会记录效果</p>
              )}
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-gray-400">
          当前支持文本、浏览器语音转录与 Hume EVI 声学情绪趋势分析。
        </p>
      </div>
    </main>
  );
}
