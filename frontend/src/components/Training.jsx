import { useState } from "react";
import trainingBreathing from "../assets/training-breathing.png";
import trainingMindfulness from "../assets/training-mindfulness.png";
import trainingEastern from "../assets/training-eastern.png";
import trainingMusic from "../assets/training-music.png";

const trainings = [
  { id: "breathing", image: trainingBreathing, zh: { title: "呼吸训练", intro: "通过调节呼吸节奏影响神经系统，帮助身体快速放松。", suitable: "缓解焦虑、降低压力、稳定情绪" }, en: { title: "Breathing", intro: "Regulate your nervous system through breathing.", suitable: "Anxiety relief, stress reduction" } },
  { id: "mindfulness", image: trainingMindfulness, zh: { title: "正念训练", intro: "将注意力带回当下，减少反复担忧和情绪消耗。", suitable: "焦虑、压力过大、思绪停不下" }, en: { title: "Mindfulness", intro: "Bring attention back to the present moment.", suitable: "Anxiety, overthinking, stress" } },
  { id: "eastern", image: trainingEastern, zh: { title: "东方动作", intro: "融合中国传统养生智慧，通过太极拳、八段锦等调节促进心理平衡。", suitable: "身体疲劳、睡眠问题、长期压力" }, en: { title: "Eastern Movement", intro: "Traditional Chinese wellness for mental balance.", suitable: "Fatigue, sleep issues, chronic stress" } },
  { id: "music", image: trainingMusic, zh: { title: "音乐放松训练", intro: "利用东西方音乐帮助大脑和身体逐渐进入放松状态。", suitable: "睡前放松、焦虑缓解、情绪恢复" }, en: { title: "Music Relaxation", intro: "Use music to help your brain and body relax.", suitable: "Sleep, anxiety, recovery" } },
];

const feedbackOptions = [
  { zh: "好很多", en: "Much better", type: "positive" },
  { zh: "有一点改善", en: "Some improvement", type: "positive" },
  { zh: "没变化", en: "No change", type: "neutral" },
  { zh: "更糟了", en: "Worse", type: "negative" },
];

export default function Training({ sessionId, state, onNavigate, onGoNext, language, onSend }) {
  const isZh = language === "zh";
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("select");
  const [feedback, setFeedback] = useState(null);

  const handleSelect = async (t) => { setSelected(t); setStep("training"); await onSend(isZh ? `我想做${t.zh.title}` : `I want to do ${t.en.title}`); };
  const handleFeedback = async (opt) => { setFeedback(opt); await onSend(isZh ? opt.zh : opt.en); setStep("done"); };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #F5EDE3, #F2E6D9)" }}>
      {/* 选择训练 */}
      {step === "select" && (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="text-5xl mb-3">🐼</div>
            <h2 className="text-2xl font-bold text-[#4A3A2A] mb-2">{isZh ? "一起练习" : "Practice Together"}</h2>
            <p className="text-[#6B5B4B]">{isZh ? "选择一个放松训练，帮助自己舒缓压力" : "Choose a relaxation exercise"}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {trainings.map((t) => (
              <button key={t.id} onClick={() => handleSelect(t)}
                className="flex items-start gap-5 p-6 rounded-2xl border border-white/60 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 text-left group"
                style={{ background: "rgba(255,255,255,0.5)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                <img src={t.image} alt="" className="w-28 h-28 object-contain rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-300" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-[#4A3A2A] mb-1.5">{isZh ? t.zh.title : t.en.title}</h3>
                  <p className="text-sm text-[#6B5B4B] mb-3 leading-relaxed">{isZh ? t.zh.intro : t.en.intro}</p>
                  <p className="text-xs text-[#A89888]">{isZh ? `适合：${t.zh.suitable}` : `For: ${t.en.suitable}`}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 训练中 */}
      {step === "training" && selected && (
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="rounded-3xl p-8 border border-white/60" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
            <img src={selected.image} alt="" className="w-full max-w-xs mx-auto rounded-2xl mb-6 shadow-md" />
            <h3 className="text-2xl font-bold text-[#4A3A2A] mb-2">{isZh ? selected.zh.title : selected.en.title}</h3>
            <p className="text-[#6B5B4B] mb-6">{isZh ? selected.zh.intro : selected.en.intro}</p>
            <div className="rounded-2xl p-6 border border-[#E8DDD0] mb-6" style={{ background: "rgba(250,246,240,0.8)" }}>
              <p className="text-[#5A4A3A] mb-4">{isZh ? "请找一个安静舒适的地方，跟随引导进行练习..." : "Find a quiet place and follow the guidance..."}</p>
              <div className="flex justify-center gap-2">
                {[0,1,2].map(i => <span key={i} className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#E8B84B", animationDelay: `${i*0.3}s` }} />)}
              </div>
            </div>
            <button onClick={() => setStep("feedback")}
              className="px-8 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #E8B84B, #E8943A)" }}>
              {isZh ? "结束训练" : "Finish"}
            </button>
          </div>
        </div>
      )}

      {/* 反馈 */}
      {step === "feedback" && (
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="rounded-3xl p-8 border border-white/60" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)" }}>
            <h3 className="text-xl font-bold text-[#4A3A2A] mb-6">{isZh ? "现在感觉如何？" : "How do you feel now?"}</h3>
            <div className="grid grid-cols-2 gap-3">
              {feedbackOptions.map((opt) => (
                <button key={opt.zh} onClick={() => handleFeedback(opt)}
                  className="px-4 py-3.5 rounded-xl border font-medium transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: opt.type === "positive" ? "rgba(72,187,120,0.08)" : opt.type === "neutral" ? "rgba(0,0,0,0.03)" : "rgba(229,62,62,0.08)",
                    borderColor: opt.type === "positive" ? "#C6F6D5" : opt.type === "neutral" ? "#E8DDD0" : "#FED7D7",
                    color: opt.type === "positive" ? "#276749" : opt.type === "neutral" ? "#5A4A3A" : "#9B2C2C",
                  }}>
                  {isZh ? opt.zh : opt.en}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 完成 */}
      {step === "done" && feedback && (
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="rounded-3xl p-8 border border-white/60" style={{ background: "rgba(255,255,255,0.6)" }}>
            <div className="text-5xl mb-4">{feedback.type === "positive" ? "😊" : feedback.type === "neutral" ? "🤔" : "💙"}</div>
            <h3 className="text-xl font-bold text-[#4A3A2A] mb-2">
              {feedback.type === "positive" ? (isZh ? "很高兴这次练习对你有所帮助" : "Glad it helped") : feedback.type === "neutral" ? (isZh ? "谢谢你的反馈" : "Thanks for feedback") : (isZh ? "谢谢你告诉我" : "Thank you for telling me")}
            </h3>
            <p className="text-[#6B5B4B] mb-6">
              {feedback.type === "positive" ? (isZh ? "情绪的改善往往来自一次次小的调整。你已经迈出了重要的一步。" : "Improvement comes from small steps.") : feedback.type === "neutral" ? (isZh ? "有时候第一次练习可能还无法带来明显变化。" : "Sometimes the first exercise may not bring noticeable change.") : (isZh ? "有时候在练习过程中，原本压抑的情绪可能会暂时浮现出来。" : "Sometimes suppressed emotions may surface during exercises.")}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => { setStep("select"); setSelected(null); setFeedback(null); }}
                className="px-6 py-2.5 rounded-xl border border-[#E0D5C8] text-[#5A4A3A] font-medium hover:bg-white/50 transition-all">
                {isZh ? "再来一次" : "Try again"}
              </button>
              <button onClick={() => onNavigate("home")}
                className="px-6 py-2.5 rounded-xl border border-[#E0D5C8] text-[#5A4A3A] font-medium hover:bg-white/50 transition-all">
                {isZh ? "返回主页" : "Home"}
              </button>
              {feedback.type === "negative" && (
                <button onClick={onGoNext}
                  className="px-6 py-2.5 rounded-xl text-white font-medium shadow-md hover:shadow-lg transition-all"
                  style={{ background: "linear-gradient(135deg, #5B8DEF, #7B5BF0)" }}>
                  {isZh ? "继续和我聊聊" : "Keep talking"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
