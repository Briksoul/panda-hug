import { useState, useEffect } from "react";

const emotions = [
  { id: "happy", label: "开心", labelEn: "Happy", glyph: "☀️", color: "#FFD93D" },
  { id: "okay", label: "平静", labelEn: "Calm", glyph: "🌿", color: "#6BCB77" },
  { id: "anxious", label: "焦虑", labelEn: "Anxious", glyph: "💜", color: "#9B59B6" },
  { id: "sad", label: "难过", labelEn: "Sad", glyph: "💧", color: "#4A90D9" },
  { id: "tired", label: "疲惫", labelEn: "Tired", glyph: "🌙", color: "#95A5A6" },
];

const culturalIdentities = [
  {
    id: "chinese_in_us",
    label: "在美求学的中国学生",
    labelEn: "Chinese student in the US",
    description: "关注跨文化适应、归属感与中美文化差异",
    descriptionEn: "Cross-cultural adjustment, belonging, and cultural differences",
  },
  {
    id: "american_in_china",
    label: "在华求学的美国学生",
    labelEn: "American student in China",
    description: "关注在华生活、语言适应与文化沟通",
    descriptionEn: "Life in China, language adjustment, and communication",
  },
  {
    id: "other",
    label: "其他",
    labelEn: "Other",
    description: "在后续对话中进一步了解你的文化背景",
    descriptionEn: "We will learn more about your background in conversation",
  },
];

const durationOptions = [
  { months: 0, label: "没有跨文化生活经历", labelEn: "No cross-cultural living experience" },
  { months: 3, label: "不到半年", labelEn: "Less than 6 months" },
  { months: 9, label: "半年到一年", labelEn: "6 months to 1 year" },
  { months: 18, label: "一到两年", labelEn: "1–2 years" },
  { months: 30, label: "两年以上", labelEn: "Over 2 years" },
];

export default function WelcomeScreen({ onStart }) {
  const [step, setStep] = useState("intro");
  const [selected, setSelected] = useState(null);
  const [culturalIdentity, setCulturalIdentity] = useState(null);
  const [language, setLanguage] = useState("zh");
  const [studyAbroadMonths, setStudyAbroadMonths] = useState(0);
  const [fadeClass, setFadeClass] = useState("opacity-100");
  const isEnglish = language === "en";

  // 点击云云进入选择
  const handleYunYunClick = () => {
    setFadeClass("opacity-0");
    setTimeout(() => {
      setStep("language");
      setFadeClass("opacity-100");
    }, 400);
  };

  const handleLanguageSelect = (value) => {
    setLanguage(value);
    setFadeClass("opacity-0");
    setTimeout(() => {
      setStep("identity");
      setFadeClass("opacity-100");
    }, 400);
  };

  const handleIdentitySelect = (identity) => {
    setCulturalIdentity(identity);
    setFadeClass("opacity-0");
    setTimeout(() => {
      setStep("duration");
      setFadeClass("opacity-100");
    }, 400);
  };

  const handleDurationSelect = (months) => {
    setStudyAbroadMonths(months);
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
        onStart(
          "",
          selected.id,
          culturalIdentity?.id || "other",
          language,
          studyAbroadMonths,
        );
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    step,
    selected,
    culturalIdentity,
    language,
    studyAbroadMonths,
    onStart,
  ]);

  return (
    <div className="welcome-screen">
      {/* 背景渐变 */}
      <div className="bg-gradient" />

      {/* Intro: 全屏云云 */}
      {step === "intro" && (
        <div className={`intro-view ${fadeClass}`} onClick={handleYunYunClick}>
          <div className="yunyun-container">
            <div className="yunyun-img breathe" role="img" aria-label="云云">🐼</div>
            <div className="glow-ring" />
          </div>
          <h1 className="title">云云</h1>
          <p className="subtitle">你的 AI 心灵伙伴</p>
          <p className="hint">轻触云云，开始对话 ✨</p>
        </div>
      )}

      {step === "language" && (
        <div className={`language-view ${fadeClass}`}>
          <div className="question-bubble">
            <p>选择你希望使用的语言 / Choose your language</p>
          </div>
          <div className="language-list">
            <button className="language-btn" onClick={() => handleLanguageSelect("zh")}>
              中文
            </button>
            <button className="language-btn" onClick={() => handleLanguageSelect("en")}>
              English
            </button>
          </div>
        </div>
      )}

      {step === "identity" && (
        <div className={`identity-view ${fadeClass}`}>
          <div className="question-bubble">
            <p>
              {isEnglish
                ? "Choose the identity that best describes you"
                : "为了更好地理解你，请选择最接近的身份"}
            </p>
          </div>
          <div className="identity-list">
            {culturalIdentities.map((identity) => (
              <button
                key={identity.id}
                className="identity-btn"
                onClick={() => handleIdentitySelect(identity)}
              >
                <span className="identity-label">
                  {isEnglish ? identity.labelEn : identity.label}
                </span>
                <span className="identity-description">
                  {isEnglish ? identity.descriptionEn : identity.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "duration" && (
        <div className={`duration-view ${fadeClass}`}>
          <div className="question-bubble">
            <p>
              {isEnglish
                ? "How long have you lived in a different cultural environment?"
                : "你在不同文化环境中生活了多久？"}
            </p>
          </div>
          <div className="duration-list">
            {durationOptions.map((option) => (
              <button
                key={option.months}
                className="duration-btn"
                onClick={() => handleDurationSelect(option.months)}
              >
                {isEnglish ? option.labelEn : option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Select: 情绪选择 */}
      {step === "select" && (
        <div className={`select-view ${fadeClass}`}>
          <div className="question-bubble">
            <p>{isEnglish ? "How are you feeling right now?" : "你现在感觉怎么样？"}</p>
          </div>

          <div className="emotion-row">
            {emotions.map((emo) => (
              <button
                key={emo.id}
                className="emotion-btn"
                onClick={() => handleSelect(emo)}
              >
                <div className="emotion-circle" style={{ borderColor: emo.color }}>
                  <span className="emotion-img" role="img" aria-label={isEnglish ? emo.labelEn : emo.label}>
                    {emo.glyph}
                  </span>
                </div>
                <span className="emotion-label">{isEnglish ? emo.labelEn : emo.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Done: 云云变成对应情绪 */}
      {step === "done" && selected && (
        <div className={`done-view ${fadeClass}`}>
          <div className="yunyun-container">
            <div className="yunyun-img selected-state" role="img" aria-label={isEnglish ? selected.labelEn : selected.label}>
              🐼
              <span className="selected-emotion">{selected.glyph}</span>
            </div>
            <div className="glow-ring" style={{ borderColor: selected.color }} />
          </div>
          <p className="selected-text">
            {isEnglish
              ? {
                  happy: "I'm glad you're feeling well ☀️",
                  okay: "Calm moments are worth noticing 🌿",
                  anxious: "It's okay. I'm here with you 💜",
                  sad: "Would you like to talk? I'm listening 💙",
                  tired: "You've been carrying a lot. Let's slow down 🌙",
                }[selected.id]
              : {
                  happy: "很高兴看到你心情不错 ☀️",
                  okay: "平静是最好的状态 🌿",
                  anxious: "没关系，我在这里陪你 💜",
                  sad: "想聊聊吗？我听着呢 💙",
                  tired: "辛苦了，休息一下吧 🌙",
                }[selected.id]}
          </p>
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        </div>
      )}

      {/* 底部安全提示 */}
      <div className="safety-bar">
        {isEnglish
          ? "🔒 Your conversation is private | Contact local emergency services in an emergency"
          : "🔒 你的对话完全保密 | 如遇紧急情况请拨打 400-161-9995"}
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
        .intro-view, .language-view, .identity-view, .duration-view, .select-view, .done-view {
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
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: rgba(255, 255, 255, 0.86);
          font-size: 180px;
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
        .identity-list {
          display: grid;
          gap: 12px;
          width: min(520px, calc(100vw - 40px));
          margin-top: 8px;
        }
        .language-list {
          display: flex;
          gap: 14px;
        }
        .language-btn {
          min-width: 150px;
          padding: 14px 24px;
          border: 1px solid rgba(99, 102, 241, 0.22);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.82);
          color: #4f46e5;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .language-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.5);
        }
        .duration-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          width: min(560px, calc(100vw - 40px));
        }
        .duration-btn {
          padding: 13px 16px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.82);
          color: #475569;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .duration-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(99, 102, 241, 0.45);
          color: #4f46e5;
        }
        .identity-btn {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 100%;
          padding: 16px 20px;
          text-align: left;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(99, 102, 241, 0.18);
          border-radius: 18px;
          cursor: pointer;
          transition: transform 0.2s, border-color 0.2s, background 0.2s;
        }
        .identity-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.55);
          background: white;
        }
        .identity-label {
          color: #374151;
          font-size: 16px;
          font-weight: 600;
        }
        .identity-description {
          color: #9ca3af;
          font-size: 13px;
          line-height: 1.5;
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
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.9);
          font-size: 44px;
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
        .selected-emotion {
          position: absolute;
          right: 34px;
          top: 34px;
          font-size: 54px;
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
