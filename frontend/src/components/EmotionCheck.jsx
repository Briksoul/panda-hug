import { useState, useEffect } from "react";
import { sendMessage, getSessionState } from "../utils/api";
import emotionSelectImg from "../assets/emotion-select.png";

const emotions = [
  { id: "positive", emoji: "☀️", zh: "充满活力", en: "Energy High", color: "from-yellow-200 to-amber-200", border: "border-amber-300" },
  { id: "stable", emoji: "🌤", zh: "还可以", en: "Stable", color: "from-green-200 to-emerald-200", border: "border-green-300" },
  { id: "tired", emoji: "😔", zh: "略显疲惫", en: "Tired", color: "from-purple-200 to-violet-200", border: "border-purple-300" },
  { id: "anxious", emoji: "😰", zh: "感到焦虑", en: "Anxious", color: "from-orange-200 to-red-200", border: "border-orange-300" },
  { id: "low", emoji: "😢", zh: "感到抑郁", en: "Low", color: "from-gray-300 to-slate-300", border: "border-gray-400" },
];

const questions = [
  { zh: "做事情缺乏兴趣或乐趣", en: "Little interest or pleasure in doing things" },
  { zh: "感到情绪低落、沮丧或绝望", en: "Feeling down, depressed, or hopeless" },
  { zh: "感到紧张、焦虑或心神不宁", en: "Feeling nervous, anxious, or on edge" },
  { zh: "无法停止或控制担忧", en: "Not being able to stop or control worrying" },
];

const scoreOptions = [
  { zh: "完全没有", en: "Not at all", score: 0 },
  { zh: "好几天", en: "Several days", score: 1 },
  { zh: "一半以上天数", en: "More than half the days", score: 2 },
  { zh: "几乎每天", en: "Nearly every day", score: 3 },
];

const bearResults = {
  happy: { emoji: "🐻", zh: "开心小熊", en: "Happy Bear", zhDesc: "当前未发现明显心理情绪风险", enDesc: "No significant emotional risk detected" },
  calm: { emoji: "🐻", zh: "平静小熊", en: "Calm Bear", zhDesc: "存在轻度心理情绪困扰", enDesc: "Mild emotional distress detected" },
  tired: { emoji: "🐻", zh: "疲惫小熊", en: "Tired Bear", zhDesc: "心理情绪风险较高", enDesc: "Higher emotional risk detected" },
};

export default function EmotionCheck({ sessionId, state, onNavigate, onGoNext, language, onSend }) {
  const isZh = language === "zh";
  const [step, setStep] = useState("select"); // select | assess | science | result
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [bearStatus, setBearStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false); // 防抖
  const [greeting, setGreeting] = useState("");

  // 根据时间设置问候
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(isZh ? "早上好" : "Good morning");
    else if (hour < 18) setGreeting(isZh ? "下午好" : "Good afternoon");
    else setGreeting(isZh ? "晚上好" : "Good evening");
  }, [isZh]);

  // 恢复状态
  useEffect(() => {
    if (state?.profile?.emotion_level && state?.emotion_assessment_done) {
      const total = (state.profile.phq2_score || 0) + (state.profile.gad2_score || 0);
      if (total <= 1) setBearStatus("happy");
      else if (total <= 3) setBearStatus("calm");
      else setBearStatus("tired");
      setStep("result");
    }
  }, [state]);

  // 选择情绪
  const handleEmotionSelect = async (emotion) => {
    if (submitting) return;
    console.log('[EmotionCheck] clicked:', emotion.id, emotion.zh);
    setSelectedEmotion(emotion);
    if (emotion.id === "positive" || emotion.id === "stable") {
      setSubmitting(true);
      try {
        await onSend(isZh ? `我现在感觉${emotion.zh}` : `I'm feeling ${emotion.en}`);
        console.log('[EmotionCheck] onSend done');
      } catch(e) {
        console.error('[EmotionCheck] onSend error:', e);
      }
      setBearStatus("happy");
      setStep("science");
      setSubmitting(false);
    } else {
      setStep("assess");
    }
  };

  // 量表回答
  const handleAnswer = async (score) => {
    if (submitting) return;
    setSubmitting(true);
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);
    const option = scoreOptions.find((o) => o.score === score);
    await onSend(isZh ? option.zh : option.en);
    if (newAnswers.length >= 4) {
      const total = newAnswers[0] + newAnswers[1] + newAnswers[2] + newAnswers[3];
      if (total <= 1) setBearStatus("happy");
      else if (total <= 5) setBearStatus("calm");
      else setBearStatus("tired");
      setStep("result");
    }
    setSubmitting(false);
  };

  // 跳过量表
  const handleSkipAssessment = async () => {
    if (submitting) return;
    setSubmitting(true);
    await onSend("跳过测试");
    setBearStatus("calm");
    setStep("result");
    setSubmitting(false);
  };

  const bear = bearResults[bearStatus] || bearResults.calm;
  const currentQuestion = answers.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* 步骤1：选择情绪 */}
      {step === "select" && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#3a2a1a] mb-2">
            {greeting}！
          </h2>
          <p className="text-lg text-[#6a5a4a] mb-8">
            {isZh ? "你现在感觉怎么样？" : "How are you feeling right now?"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {emotions.map((emo) => (
              <button
                key={emo.id}
                onClick={() => handleEmotionSelect(emo)}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br ${emo.color} border ${emo.border} hover:scale-105 hover:shadow-lg transition-all`}
              >
                <span className="text-5xl">{emo.emoji}</span>
                <span className="text-sm font-semibold text-[#3a2a1a]">
                  {isZh ? emo.zh : emo.en}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 步骤2：量表评估 */}
      {step === "assess" && (
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e8ddd0]">
            <h3 className="text-xl font-bold text-[#3a2a1a] mb-2">
              {isZh ? "情绪小测试" : "Emotion Assessment"}
            </h3>
            <p className="text-sm text-[#8a7a6a] mb-6">
              {isZh
                ? "为了更好地了解您的情绪状况，请回答以下问题："
                : "To better understand your emotional state, please answer:"}
            </p>

            {/* 进度条 */}
            <div className="flex gap-2 mb-6">
              {questions.map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full ${i < currentQuestion ? "bg-amber-400" : i === currentQuestion ? "bg-amber-200" : "bg-gray-200"}`}></div>
              ))}
            </div>

            {/* 当前问题 */}
            <div className="mb-6">
              <p className="text-lg font-medium text-[#3a2a1a] mb-1">
                {currentQuestion + 1}/4
              </p>
              <p className="text-[#5a4a3a]">
                {isZh ? questions[currentQuestion].zh : questions[currentQuestion].en}
              </p>
            </div>

            {/* 选项 */}
            <div className="grid grid-cols-2 gap-3">
              {scoreOptions.map((opt) => (
                <button
                  key={opt.score}
                  onClick={() => handleAnswer(opt.score)}
                  disabled={submitting}
                  className="px-4 py-3 rounded-xl bg-[#faf6f0] border border-[#e8ddd0] text-[#5a4a3a] font-medium hover:bg-[#f0e6d8] hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {isZh ? opt.zh : opt.en}
                </button>
              ))}
            </div>
            {/* 跳过按钮 */}
            <button
              onClick={handleSkipAssessment}
              disabled={submitting}
              className="mt-4 text-sm text-[#8a7a6a] hover:text-[#5a4a3a] underline disabled:opacity-50"
            >
              {isZh ? "跳过测试，直接聊聊" : "Skip, let's chat"}
            </button>
          </div>
        </div>
      )}

      {/* 步骤2b：科普文案（积极情绪） */}
      {step === "science" && (
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e8ddd0] max-w-lg mx-auto">
            <div className="text-6xl mb-4">☀️</div>
            <h3 className="text-xl font-bold text-[#3a2a1a] mb-4">
              {isZh ? "心理小科普" : "Psychology Tip"}
            </h3>
            <div className="bg-[#faf6f0] rounded-xl p-5 border border-[#e8ddd0] mb-6">
              <p className="text-[#5a4a3a] leading-relaxed">
                {isZh
                  ? "心理健康需要关注日常情绪调节和心理自我照护，这是每个人都可以实践的小技巧。保持积极心态的同时，也别忘了给自己留一些放松和反思的时间。"
                  : "Mental health requires daily emotional regulation and self-care. These are small practices everyone can do. While maintaining a positive attitude, remember to set aside time for relaxation and reflection."}
              </p>
            </div>
            <p className="text-[#6a5a4a] mb-4">
              {isZh ? "要进一步和我聊聊吗？" : "Would you like to chat more?"}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onGoNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:shadow-lg transition-all"
              >
                {isZh ? "陪你倾诉 →" : "Confide →"}
              </button>
              <button
                onClick={() => onNavigate("home")}
                className="px-6 py-2.5 rounded-xl bg-[#faf6f0] border border-[#e8ddd0] text-[#5a4a3a] font-medium hover:bg-[#f0e6d8] transition-all"
              >
                {isZh ? "返回主页" : "Home"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 步骤3：结果 */}
      {step === "result" && bearStatus && (
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e8ddd0] max-w-lg mx-auto">
            <div className="text-8xl mb-4">{bear.emoji}</div>
            <h3 className="text-2xl font-bold text-[#3a2a1a] mb-2">
              {isZh ? bear.zh : bear.en}
            </h3>
            <p className="text-[#6a5a4a] mb-6">
              {isZh ? bear.zhDesc : bear.enDesc}
            </p>

            {/* 超链接引导 */}
            <div className="bg-[#faf6f0] rounded-xl p-4 border border-[#e8ddd0]">
              <p className="text-[#5a4a3a] mb-3">
                {isZh
                  ? "要进一步和我聊聊吗？我可以陪你一起梳理困扰、理解情绪，并为你生成专属的心理情绪洞察报告。"
                  : "Would you like to chat more? I can help you sort out your feelings and generate a personalized insight report."}
              </p>
              <button
                onClick={onGoNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                {isZh ? "点击「陪你倾诉」，我们开始吧！" : "Click 'Confide' to begin!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
