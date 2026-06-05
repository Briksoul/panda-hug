import { useState, useEffect } from "react";
import yunyunDefault from "../assets/yunyun/okay.jpg";
import yunyunHappy from "../assets/yunyun/happy.jpg";
import yunyunOkay from "../assets/yunyun/okay.jpg";
import yunyunAnxious from "../assets/yunyun/anxious.jpg";
import yunyunSad from "../assets/yunyun/sad.jpg";
import yunyunTired from "../assets/yunyun/tired.jpg";

const emotions = [
  { id: "happy", label: "开心", image: yunyunHappy, color: "#FFD93D" },
  { id: "okay", label: "平静", image: yunyunOkay, color: "#6BCB77" },
  { id: "anxious", label: "焦虑", image: yunyunAnxious, color: "#9B59B6" },
  { id: "sad", label: "难过", image: yunyunSad, color: "#4A90D9" },
  { id: "tired", label: "疲惫", image: yunyunTired, color: "#95A5A6" },
];

export default function WelcomeScreen({ onStart }) {
  const [step, setStep] = useState("intro"); // intro | select | done
  const [selected, setSelected] = useState(null);
  const [fadeClass, setFadeClass] = useState("opacity-100");

  // 点击云云进入选择
  const handleYunYunClick = () => {
    setFadeClass("opacity-0");
    setTimeout(() => {
      setStep("select");
      setFadeClass("opacity-100");
    }, 400);
  };

  // 选择情绪
  const handleSelect = (emotion) => {
    setSelected(emotion);
    setFadeClass("opacity-0 scale-95");
    setTimeout(() => {
      setStep("done");
      setFadeClass("opacity-100 scale-100");
    }, 500);
  };

  // 动画完成后进入对话
  useEffect(() => {
    if (step === "done" && selected) {
      const timer = setTimeout(() => {
        onStart("", selected.id);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, selected, onStart]);

  return (
    <div className="welcome-screen">
      {/* 背景渐变 */}
      <div className="bg-gradient" />

      {/* Intro: 全屏云云 */}
      {step === "intro" && (
        <div className={`intro-view ${fadeClass}`} onClick={handleYunYunClick}>
          <div className="yunyun-container">
            <img src={yunyunDefault} alt="云云" className="yunyun-img breathe" />
            <div className="glow-ring" />
          </div>
          <h1 className="title">云云</h1>
          <p className="subtitle">你的 AI 心灵伙伴</p>
          <p className="hint">轻触云云，开始对话 ✨</p>
        </div>
      )}

      {/* Select: 情绪选择 */}
      {step === "select" && (
        <div className={`select-view ${fadeClass}`}>
          <div className="question-bubble">
            <p>你现在感觉怎么样？</p>
          </div>

          <div className="emotion-row">
            {emotions.map((emo) => (
              <button
                key={emo.id}
                className="emotion-btn"
                onClick={() => handleSelect(emo)}
              >
                <div className="emotion-circle" style={{ borderColor: emo.color }}>
                  <img src={emo.image} alt={emo.label} className="emotion-img" />
                </div>
                <span className="emotion-label">{emo.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Done: 云云变成对应情绪 */}
      {step === "done" && selected && (
        <div className={`done-view ${fadeClass}`}>
          <div className="yunyun-container">
            <img
              src={selected.image}
              alt={selected.label}
              className="yunyun-img selected-state"
            />
            <div className="glow-ring" style={{ borderColor: selected.color }} />
          </div>
          <p className="selected-text">
            {selected.label === "开心" && "很高兴看到你心情不错 ☀️"}
            {selected.label === "平静" && "平静是最好的状态 🌿"}
            {selected.label === "焦虑" && "没关系，我在这里陪你 💜"}
            {selected.label === "难过" && "想聊聊吗？我听着呢 💙"}
            {selected.label === "疲惫" && "辛苦了，休息一下吧 🌙"}
          </p>
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        </div>
      )}

      {/* 底部安全提示 */}
      <div className="safety-bar">
        🔒 你的对话完全保密 &nbsp;|&nbsp; 如遇紧急情况请拨打 400-161-9995
      </div>

      <style>{`
        .welcome-screen {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .bg-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 30%, #fce7f3 60%, #e0f2fe 100%);
          z-index: 0;
        }

        /* === Intro === */
        .intro-view, .select-view, .done-view {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          transition: opacity 0.4s ease, transform 0.4s ease;
          cursor: pointer;
        }
        .yunyun-container {
          position: relative;
          width: 320px;
          height: 320px;
        }
        .yunyun-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          box-shadow: 0 20px 60px rgba(99, 102, 241, 0.3);
        }
        .breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .glow-ring {
          position: absolute;
          inset: -8px;
          border: 3px solid rgba(139, 92, 246, 0.3);
          border-radius: 50%;
          animation: pulse-ring 2s ease-in-out infinite;
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .title {
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }
        .subtitle {
          font-size: 18px;
          color: #6b7280;
          margin: 0;
        }
        .hint {
          font-size: 14px;
          color: #9ca3af;
          margin-top: 8px;
          animation: float 2s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        /* === Select === */
        .question-bubble {
          background: white;
          padding: 16px 32px;
          border-radius: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          font-size: 20px;
          color: #374151;
          font-weight: 500;
        }
        .emotion-row {
          display: flex;
          gap: 20px;
          margin-top: 12px;
        }
        .emotion-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .emotion-btn:hover {
          transform: translateY(-8px);
        }
        .emotion-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 3px solid transparent;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .emotion-btn:hover .emotion-circle {
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .emotion-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .emotion-label {
          font-size: 14px;
          color: #4b5563;
          font-weight: 500;
        }

        /* === Done === */
        .selected-state {
          animation: pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes pop-in {
          0% { transform: scale(0.8); }
          100% { transform: scale(1); }
        }
        .selected-text {
          font-size: 20px;
          color: #374151;
          font-weight: 500;
          margin: 8px 0;
        }
        .loading-dots {
          display: flex;
          gap: 6px;
        }
        .loading-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #8b5cf6;
          animation: dot-bounce 1.4s infinite both;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* === Safety Bar === */
        .safety-bar {
          position: absolute;
          bottom: 16px;
          font-size: 12px;
          color: #9ca3af;
          z-index: 2;
        }
      `}</style>
    </div>
  );
}
