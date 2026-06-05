import { useState } from "react";
import moodHappy from "../assets/emotions/mood_happy.png";
import moodOkay from "../assets/emotions/mood_okay.png";
import moodAnxious from "../assets/emotions/mood_anxious.png";
import moodSad from "../assets/emotions/mood_sad.png";
import moodTired from "../assets/emotions/mood_tired.png";

const emotionOptions = [
  { image: moodHappy, label: "开心", value: "positive" },
  { image: moodOkay, label: "还可以", value: "mild" },
  { image: moodAnxious, label: "焦虑", value: "anxious" },
  { image: moodSad, label: "难过", value: "sad" },
  { image: moodTired, label: "疲惫", value: "tired" },
];

export default function WelcomeScreen({ onStart, loading }) {
  const [name, setName] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [step, setStep] = useState(1); // 1=名字, 2=情绪

  const handleNameSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleEmotionSelect = (emotion) => {
    setSelectedEmotion(emotion.value);
    onStart(name, emotion.value);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="text-center max-w-lg mx-auto px-6">
        {/* 熊猫 Logo */}
        <div className="text-8xl mb-6 breathe-animation">🐼</div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Panda Hug
        </h1>
        <p className="text-gray-500 mb-2 text-lg">跨文化智能心理伴侣</p>
        <p className="text-gray-400 mb-10 text-sm">
          A safe space for your mind, across cultures.
        </p>

        {step === 1 ? (
          /* Step 1: 名字输入 */
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的名字（选填）"
              className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-center text-lg transition-all bg-white/80 backdrop-blur"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-200"
            >
              继续 →
            </button>
            <button
              type="button"
              onClick={() => { setStep(2); }}
              className="text-sm text-gray-400 hover:text-gray-600 transition"
            >
              跳过
            </button>
          </form>
        ) : (
          /* Step 2: 情绪选择 */
          <div className="space-y-4">
            <p className="text-gray-600 mb-2">
              {name ? `${name}，` : ""}你现在感觉怎么样？
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              {emotionOptions.map((emotion) => (
                <button
                  key={emotion.value}
                  onClick={() => handleEmotionSelect(emotion)}
                  disabled={loading}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200
                    bg-white/80 backdrop-blur hover:border-indigo-300 hover:shadow-lg
                    transition-all group w-24
                    ${selectedEmotion === emotion.value ? "border-indigo-500 shadow-lg ring-2 ring-indigo-100" : ""}
                  `}
                >
                  <img
                    src={emotion.image}
                    alt={emotion.label}
                    className="w-16 h-16 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm text-gray-700 font-medium">{emotion.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-8 leading-relaxed">
          🔒 你的对话内容完全保密<br />
          如遇紧急情况，请拨打 400-161-9995
        </p>
      </div>
    </div>
  );
}
