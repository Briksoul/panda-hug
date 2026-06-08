import { useState, useEffect } from "react";

export default function WelcomeScreen({ onStart, loading }) {
  const [step, setStep] = useState("language"); // language | intro | done
  const [language, setLanguage] = useState("zh");
  const [fadeClass, setFadeClass] = useState("opacity-100");

  const isZh = language === "zh";

  // 选择语言
  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    setFadeClass("opacity-0");
    setTimeout(() => {
      setStep("intro");
      setFadeClass("opacity-100");
    }, 400);
  };

  // 点击 Panda 进入对话
  const handlePandaClick = () => {
    setFadeClass("opacity-0 scale-95");
    setTimeout(() => {
      setStep("done");
      setFadeClass("opacity-100 scale-100");
    }, 500);
  };

  // 动画完成后进入对话
  useEffect(() => {
    if (step === "done") {
      const timer = setTimeout(() => {
        onStart("", language);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, language, onStart]);

  return (
    <div className="welcome-screen">
      <div className="bg-gradient" />

      {/* 语言选择 */}
      {step === "language" && (
        <div className={`language-view ${fadeClass}`}>
          <div className="panda-icon">🐼</div>
          <h1 className="title">Panda Hug</h1>
          <p className="subtitle">{isZh ? "跨文化智能心理伴侣" : "Cross-cultural AI Companion"}</p>

          <div className="lang-row">
            <button className="lang-btn" onClick={() => handleLanguageSelect("zh")}>
              <span className="lang-flag">🇨🇳</span>
              <span className="lang-name">中文</span>
            </button>
            <button className="lang-btn" onClick={() => handleLanguageSelect("en")}>
              <span className="lang-flag">🇺🇸</span>
              <span className="lang-name">English</span>
            </button>
          </div>
        </div>
      )}

      {/* 介绍页 */}
      {step === "intro" && (
        <div className={`intro-view ${fadeClass}`} onClick={handlePandaClick}>
          <div className="panda-container">
            <div className="panda-emoji breathe">🐼</div>
            <div className="glow-ring" />
          </div>
          <div className="intro-text">
            <p>{isZh ? "Hi，我是 Panda！" : "Hi, I'm Panda!"}</p>
            <p>{isZh
              ? "无论你来自中国、美国，还是正在异国求学的留学生，"
              : "Whether you're from China, the US, or studying abroad,"}</p>
            <p>{isZh
              ? "当你开心、疲惫、焦虑、迷茫的时候，"
              : "whether you're happy, tired, anxious, or confused,"}</p>
            <p>{isZh
              ? "我都会在这里陪伴你。"
              : "I'll be here for you."}</p>
          </div>
          <p className="hint">{isZh ? "轻触开始 ✨" : "Tap to start ✨"}</p>
        </div>
      )}

      {/* 进入中 */}
      {step === "done" && (
        <div className={`done-view ${fadeClass}`}>
          <div className="panda-container">
            <div className="panda-emoji selected-state">🐼</div>
          </div>
          <p className="selected-text">
            {isZh ? "正在为你准备..." : "Preparing for you..."}
          </p>
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        </div>
      )}

      {/* 底部安全提示 */}
      <div className="safety-bar">
        🔒 {isZh ? "对话完全保密 | 如遇紧急情况请拨打 12356" : "Confidential | In emergency call 988"}
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

        .language-view, .intro-view, .done-view {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .panda-icon {
          font-size: 80px;
          margin-bottom: 8px;
        }

        .panda-container {
          position: relative;
          width: 200px;
          height: 200px;
        }
        .panda-emoji {
          font-size: 120px;
          line-height: 200px;
          text-align: center;
        }
        .breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
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
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        .lang-row {
          display: flex;
          gap: 16px;
          margin-top: 24px;
        }
        .lang-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 32px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .lang-btn:hover {
          border-color: #8b5cf6;
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
        }
        .lang-flag {
          font-size: 36px;
        }
        .lang-name {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .intro-text {
          text-align: center;
          font-size: 18px;
          color: #374151;
          line-height: 1.8;
          max-width: 400px;
        }
        .intro-text p {
          margin: 0;
        }
        .intro-text p:first-child {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .hint {
          font-size: 14px;
          color: #9ca3af;
          margin-top: 16px;
          animation: float 2s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .intro-view {
          cursor: pointer;
        }

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
