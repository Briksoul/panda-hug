import { useState, useEffect } from "react";
import emotionSelectImg from "../assets/emotion-select.png";

const emotions = [
  { id: "positive", emoji: "☀️", zh: "充满活力", en: "Energy High", gradient: "linear-gradient(135deg, #FFF3D4, #FFE4A0)", shadow: "rgba(232,184,75,0.25)", iconColor: "#E8B84B" },
  { id: "stable", emoji: "🌤", zh: "还可以", en: "Stable", gradient: "linear-gradient(135deg, #D4F5E0, #A8E6C0)", shadow: "rgba(72,187,120,0.2)", iconColor: "#48BB78" },
  { id: "tired", emoji: "😔", zh: "略显疲惫", en: "Tired", gradient: "linear-gradient(135deg, #E8D8F5, #C8B0E8)", shadow: "rgba(159,122,234,0.2)", iconColor: "#9F7AEA" },
  { id: "anxious", emoji: "😰", zh: "感到焦虑", en: "Anxious", gradient: "linear-gradient(135deg, #FFE0D0, #FFC0A0)", shadow: "rgba(237,137,54,0.2)", iconColor: "#ED8936" },
  { id: "low", emoji: "😢", zh: "感到抑郁", en: "Low", gradient: "linear-gradient(135deg, #D8E0E8, #B8C8D8)", shadow: "rgba(113,128,150,0.2)", iconColor: "#718096" },
];

const questions = [
  { zh: "做事情缺乏兴趣或乐趣", en: "Little interest or pleasure in doing things" },
  { zh: "感到情绪低落、沮丧或绝望", en: "Feeling down, depressed, or hopeless" },
  { zh: "感到紧张、焦虑或心神不宁", en: "Feeling nervous, anxious, or on edge" },
  { zh: "无法停止或控制担忧", en: "Not being able to stop or control worrying" },
];

const scoreOptions = [
  { zh: "完全没有", en: "Not at all", score: 0, color: "#48BB78" },
  { zh: "好几天", en: "Several days", score: 1, color: "#ECC94B" },
  { zh: "一半以上天数", en: "More than half", score: 2, color: "#ED8936" },
  { zh: "几乎每天", en: "Nearly every day", score: 3, color: "#E53E3E" },
];

const bearResults = {
  happy: { emoji: "🐻", zh: "开心小熊", en: "Happy Bear", zhDesc: "当前未发现明显心理情绪风险", enDesc: "No significant emotional risk detected", color: "#48BB78" },
  calm: { emoji: "🐻", zh: "平静小熊", en: "Calm Bear", zhDesc: "存在轻度心理情绪困扰", enDesc: "Mild emotional distress detected", color: "#ECC94B" },
  tired: { emoji: "🐻", zh: "疲惫小熊", en: "Tired Bear", zhDesc: "心理情绪风险较高", enDesc: "Higher emotional risk detected", color: "#E53E3E" },
};

export default function EmotionCheck({ sessionId, state, onNavigate, onGoNext, language, onSend }) {
  const isZh = language === "zh";
  const [step, setStep] = useState("select");
  const [answers, setAnswers] = useState([]);
  const [bearStatus, setBearStatus] = useState(null);

  useEffect(() => {
    if (state?.emotion_assessment_done) {
      const total = (state.profile?.phq2_score || 0) + (state.profile?.gad2_score || 0);
      if (total <= 1) setBearStatus("happy");
      else if (total <= 3) setBearStatus("calm");
      else setBearStatus("tired");
      setStep("result");
    }
  }, [state]);

  const handleEmotionSelect = async (emotion) => {
    if (emotion.id === "positive" || emotion.id === "stable") {
      await onSend(isZh ? `我现在感觉${emotion.zh}` : `I'm feeling ${emotion.en}`);
      setBearStatus("happy");
      setStep("result");
    } else {
      setStep("assess");
    }
  };

  const handleAnswer = async (score) => {
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
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? (isZh ? "早上好" : "Good morning") : hour < 18 ? (isZh ? "下午好" : "Good afternoon") : (isZh ? "晚上好" : "Good evening");
  const bear = bearResults[bearStatus] || bearResults.calm;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #F5EDE3, #F2E6D9)" }}>
      {/* 步骤1：选择情绪 */}
      {step === "select" && (
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-[#4A3A2A] mb-2">{greeting}！</h2>
          <p className="text-lg text-[#6B5B4B] mb-10">{isZh ? "你现在感觉怎么样？" : "How are you feeling right now?"}</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {emotions.map((emo) => (
              <button key={emo.id} onClick={() => handleEmotionSelect(emo)}
                className="flex flex-col items-center gap-4 py-8 px-4 rounded-2xl border border-white/60 hover:scale-105 hover:-translate-y-1 transition-all duration-300 group"
                style={{ background: emo.gradient, boxShadow: `0 8px 24px ${emo.shadow}` }}>
                <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{emo.emoji}</span>
                <span className="text-sm font-bold text-[#3A2A1A]">{isZh ? emo.zh : emo.en}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 步骤2：量表评估 */}
      {step === "assess" && (
        <div className="max-w-lg mx-auto px-6 py-16">
          <div className="rounded-3xl p-8 border border-white/60" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
            <h3 className="text-xl font-bold text-[#4A3A2A] mb-2 text-center">{isZh ? "情绪小测试" : "Emotion Assessment"}</h3>
            <p className="text-sm text-[#8A7A6A] mb-6 text-center">{isZh ? "过去两周，以下情况出现的频率是？" : "Over the past 2 weeks, how often:"}</p>
            {/* 进度条 */}
            <div className="flex gap-2 mb-8">
              {questions.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-500"
                  style={{ background: i < answers.length ? "#E8B84B" : i === answers.length ? "rgba(232,184,75,0.4)" : "rgba(0,0,0,0.06)" }} />
              ))}
            </div>
            {/* 问题 */}
            <div className="mb-8 text-center">
              <p className="text-3xl font-bold text-[#E8B84B] mb-2">{answers.length + 1}/4</p>
              <p className="text-[#5A4A3A] text-lg">{isZh ? questions[answers.length].zh : questions[answers.length].en}</p>
            </div>
            {/* 选项 */}
            <div className="grid grid-cols-2 gap-3">
              {scoreOptions.map((opt) => (
                <button key={opt.score} onClick={() => handleAnswer(opt.score)}
                  className="px-4 py-4 rounded-xl border border-[#E8DDD0] text-[#5A4A3A] font-medium hover:scale-[1.02] transition-all duration-200"
                  style={{ background: "rgba(250,246,240,0.8)" }}>
                  {isZh ? opt.zh : opt.en}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 步骤3：结果 */}
      {step === "result" && bearStatus && (
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="rounded-3xl p-10 border border-white/60" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
            <div className="text-8xl mb-4">{bear.emoji}</div>
            <h3 className="text-2xl font-bold text-[#4A3A2A] mb-2">{isZh ? bear.zh : bear.en}</h3>
            <p className="text-[#6B5B4B] mb-8">{isZh ? bear.zhDesc : bear.enDesc}</p>
            {/* 超链接引导 */}
            <div className="rounded-2xl p-6 border border-[#E8DDD0]" style={{ background: "rgba(250,246,240,0.8)" }}>
              <p className="text-[#5A4A3A] mb-4 leading-relaxed">
                {isZh ? "要进一步和我聊聊吗？我可以陪你一起梳理困扰、理解情绪，并为你生成专属的心理情绪洞察报告。" : "Would you like to chat more? I can help you generate a personalized insight report."}
              </p>
              <button onClick={onGoNext}
                className="px-8 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                style={{ background: "linear-gradient(135deg, #5B8DEF, #7B5BF0)" }}>
                {isZh ? "点击「陪你倾诉」，我们开始吧！" : "Click 'Confide' to begin!"} →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
