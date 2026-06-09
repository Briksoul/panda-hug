import { useState } from "react";
import { sendMessage } from "../utils/api";
import trainingBreathing from "../assets/training-breathing.png";
import trainingMindfulness from "../assets/training-mindfulness.png";
import trainingEastern from "../assets/training-eastern.png";
import trainingMusic from "../assets/training-music.png";

const trainings = [
  {
    id: "breathing",
    emoji: "🧘",
    zh: { title: "呼吸训练", intro: "通过调节呼吸节奏影响神经系统，帮助身体快速放松。", suitable: "缓解焦虑、降低压力、稳定情绪" },
    en: { title: "Breathing", intro: "Regulate your nervous system through breathing rhythm.", suitable: "Anxiety relief, stress reduction" },
    image: trainingBreathing,
    video: "/videos/呼吸训练.mp4",
    color: "from-teal-200 to-cyan-200",
    border: "border-teal-300",
  },
  {
    id: "mindfulness",
    emoji: "🧠",
    zh: { title: "正念训练", intro: "将注意力带回当下，减少反复担忧和情绪消耗。", suitable: "焦虑、压力过大、思绪停不下" },
    en: { title: "Mindfulness", intro: "Bring attention back to the present moment.", suitable: "Anxiety, overthinking, stress" },
    image: trainingMindfulness,
    video: "/videos/正念训练.mp4",
    color: "from-blue-200 to-indigo-200",
    border: "border-blue-300",
  },
  {
    id: "eastern",
    emoji: "🤸",
    zh: { title: "东方动作", intro: "融合中国传统养生智慧，通过太极拳、八段锦等调节促进心理平衡。", suitable: "身体疲劳、睡眠问题、长期压力、情绪紧绷" },
    en: { title: "Eastern Movement", intro: "Traditional Chinese wellness wisdom for mental balance.", suitable: "Fatigue, sleep issues, chronic stress" },
    image: trainingEastern,
    video: "/videos/东方动作.mp4",
    color: "from-amber-200 to-orange-200",
    border: "border-amber-300",
  },
  {
    id: "music",
    emoji: "🎵",
    zh: { title: "音乐放松训练", intro: "利用东西方音乐帮助大脑和身体逐渐进入放松状态。", suitable: "睡前放松、焦虑缓解、学习减压、情绪恢复" },
    en: { title: "Music Relaxation", intro: "Use music to help your brain and body relax.", suitable: "Sleep, anxiety, study stress, recovery" },
    image: trainingMusic,
    video: "/videos/音乐放松训练.mp4",
    color: "from-purple-200 to-pink-200",
    border: "border-purple-300",
  },
];

const feedbackOptions = [
  { zh: "好很多", en: "Much better", type: "positive" },
  { zh: "有一点改善", en: "Some improvement", type: "positive" },
  { zh: "没变化", en: "No change", type: "neutral" },
  { zh: "更糟了", en: "Worse", type: "negative" },
];

export default function Training({ sessionId, state, onNavigate, onGoNext, language, onSend }) {
  const isZh = language === "zh";
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [step, setStep] = useState("select"); // select | training | feedback | done
  const [feedback, setFeedback] = useState(null);

  // 选择训练
  const handleSelect = async (training) => {
    setSelectedTraining(training);
    setStep("training");
    // 通知后端
    await onSend(isZh ? `我想做${training.zh.title}` : `I want to do ${training.en.title}`);
  };

  // 完成训练
  const handleFinish = () => {
    setStep("feedback");
  };

  // 提交反馈
  const handleFeedback = async (opt) => {
    setFeedback(opt);
    await onSend(isZh ? opt.zh : opt.en);
    setStep("done");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* 步骤1：选择训练 */}
      {step === "select" && (
        <div>
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🐼</div>
            <h2 className="text-2xl font-bold text-[#3a2a1a] mb-2">
              {isZh ? "一起练习" : "Practice Together"}
            </h2>
            <p className="text-[#6a5a4a]">
              {isZh ? "选择一个放松训练，帮助自己舒缓压力" : "Choose a relaxation exercise to relieve stress"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trainings.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelect(t)}
                className={`flex flex-col p-5 rounded-2xl bg-gradient-to-br ${t.color} border ${t.border} hover:scale-[1.03] hover:shadow-lg transition-all text-left`}
              >
                {t.image ? (
                  <img src={t.image} alt="" className="w-full h-40 object-contain rounded-xl mb-3" />
                ) : (
                  <div className="text-4xl mb-3">{t.emoji}</div>
                )}
                <h3 className="text-lg font-bold text-[#3a2a1a] mb-1">
                  {isZh ? t.zh.title : t.en.title}
                </h3>
                <p className="text-sm text-[#6a5a4a] mb-2 leading-relaxed">
                  {isZh ? t.zh.intro : t.en.intro}
                </p>
                <p className="text-xs text-[#8a7a6a]">
                  {isZh ? `适合：${t.zh.suitable}` : `For: ${t.en.suitable}`}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 步骤2：训练中 */}
      {step === "training" && selectedTraining && (
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e8ddd0] max-w-lg mx-auto">
            <div className="text-6xl mb-4">{selectedTraining.emoji}</div>
            {selectedTraining.image && (
              <img src={selectedTraining.image} alt="" className="w-full max-w-sm mx-auto rounded-2xl mb-4 shadow-md" />
            )}

            {/* 训练视频区域 */}
            <div className="bg-[#faf6f0] rounded-xl p-4 mb-6 border border-[#e8ddd0]">
              {selectedTraining.video ? (
                <video
                  key={selectedTraining.id}
                  src={selectedTraining.video}
                  controls
                  autoPlay
                  className="w-full max-w-md mx-auto rounded-xl shadow-md"
                />
              ) : (
                <p className="text-[#8a7a6a] text-sm">{isZh ? "暂无视频" : "No video available"}</p>
              )}
            </div>
            <h3 className="text-2xl font-bold text-[#3a2a1a] mb-2">
              {isZh ? selectedTraining.zh.title : selectedTraining.en.title}
            </h3>
            <p className="text-[#6a5a4a] mb-6">
              {isZh ? selectedTraining.zh.intro : selectedTraining.en.intro}
            </p>

            {/* 训练引导区域 */}
            <div className="bg-[#faf6f0] rounded-xl p-6 mb-6 border border-[#e8ddd0]">
              <p className="text-[#5a4a3a] mb-4">
                {isZh
                  ? "请找一个安静舒适的地方，跟随引导进行练习..."
                  : "Find a quiet, comfortable place and follow the guidance..."}
              </p>
              <div className="flex justify-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: "0.3s" }}></span>
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: "0.6s" }}></span>
              </div>
              <p className="text-sm text-[#8a7a6a]">
                {isZh ? "训练进行中..." : "Training in progress..."}
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold hover:shadow-lg transition-all"
            >
              {isZh ? "结束训练" : "Finish Training"}
            </button>
          </div>
        </div>
      )}

      {/* 步骤3：反馈 */}
      {step === "feedback" && (
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e8ddd0] max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-[#3a2a1a] mb-2">
              {isZh ? "现在感觉如何？" : "How do you feel now?"}
            </h3>
            <p className="text-[#6a5a4a] mb-6">
              {isZh ? "请选择最符合你当前感受的选项" : "Select the option that best matches your feeling"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {feedbackOptions.map((opt) => (
                <button
                  key={opt.type + opt.zh}
                  onClick={() => handleFeedback(opt)}
                  className={`px-4 py-3 rounded-xl border font-medium transition-all hover:scale-[1.02] ${
                    opt.type === "positive"
                      ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      : opt.type === "neutral"
                      ? "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  }`}
                >
                  {isZh ? opt.zh : opt.en}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 步骤4：完成 */}
      {step === "done" && feedback && (
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e8ddd0] max-w-lg mx-auto">
            {feedback.type === "positive" && (
              <>
                <div className="text-5xl mb-4">😊</div>
                <h3 className="text-xl font-bold text-[#3a2a1a] mb-2">
                  {isZh ? "很高兴这次练习对你有所帮助" : "Glad this exercise helped you"}
                </h3>
                <p className="text-[#6a5a4a] mb-6">
                  {isZh
                    ? "情绪的改善往往来自一次次小的调整。你已经迈出了重要的一步。"
                    : "Emotional improvement comes from small adjustments. You've taken an important step."}
                </p>
              </>
            )}
            {feedback.type === "neutral" && (
              <>
                <div className="text-5xl mb-4">🤔</div>
                <h3 className="text-xl font-bold text-[#3a2a1a] mb-2">
                  {isZh ? "谢谢你的反馈" : "Thanks for your feedback"}
                </h3>
                <p className="text-[#6a5a4a] mb-6">
                  {isZh
                    ? "有时候第一次练习可能还无法带来明显变化。"
                    : "Sometimes the first exercise may not bring noticeable change."}
                </p>
              </>
            )}
            {feedback.type === "negative" && (
              <>
                <div className="text-5xl mb-4">💙</div>
                <h3 className="text-xl font-bold text-[#3a2a1a] mb-2">
                  {isZh ? "谢谢你告诉我" : "Thank you for telling me"}
                </h3>
                <p className="text-[#6a5a4a] mb-6">
                  {isZh
                    ? "有时候在练习过程中，原本压抑的情绪可能会暂时浮现出来。"
                    : "Sometimes suppressed emotions may surface during exercises."}
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => { setStep("select"); setSelectedTraining(null); setFeedback(null); }}
                className="px-6 py-2.5 rounded-xl bg-[#faf6f0] border border-[#e8ddd0] text-[#5a4a3a] font-medium hover:bg-[#f0e6d8] transition-all"
              >
                {isZh ? "再来一次" : "Try again"}
              </button>
              <button
                onClick={() => onNavigate("home")}
                className="px-6 py-2.5 rounded-xl bg-[#faf6f0] border border-[#e8ddd0] text-[#5a4a3a] font-medium hover:bg-[#f0e6d8] transition-all"
              >
                {isZh ? "返回主页" : "Home"}
              </button>
              {feedback.type === "negative" && (
                <button
                  onClick={onGoNext}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:shadow-lg transition-all"
                >
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
