import { useEffect, useMemo, useState } from "react";
import { recordSelfGuidedTraining } from "../utils/api";

const exercises = [
  {
    id: "breathing",
    title: "腹式呼吸",
    titleEn: "Diaphragmatic Breathing",
    description: "通过缓慢呼吸帮助身体从紧张状态中稳定下来。",
    descriptionEn: "Use slow breathing to help your body settle from tension.",
    duration: 36,
    video: "/videos/呼吸训练.mp4",
    guidance: ["吸气 4 秒", "停留 2 秒", "呼气 6 秒"],
    guidanceEn: ["Inhale for 4 seconds", "Hold for 2 seconds", "Exhale for 6 seconds"],
  },
  {
    id: "mindfulness",
    title: "五感正念",
    titleEn: "Five-Senses Mindfulness",
    description: "将注意力带回当下，减少反复担忧和思绪消耗。",
    descriptionEn: "Return attention to the present and reduce repetitive worry.",
    duration: 97,
    video: "/videos/正念训练.mp4",
    guidance: ["观察五样看到的事物", "感受四种身体触觉", "聆听三种声音", "觉察两种气味", "留意一种味道"],
    guidanceEn: ["Notice five things you see", "Feel four physical sensations", "Hear three sounds", "Notice two scents", "Notice one taste"],
  },
  {
    id: "muscle_relaxation",
    title: "渐进式肌肉放松",
    titleEn: "Progressive Muscle Relaxation",
    description: "依次收紧和放松肌肉，释放身体积累的压力。",
    descriptionEn: "Tense and release muscle groups to reduce physical stress.",
    duration: 300,
    guidance: ["放松面部和下颌", "收紧并放松肩膀", "放松双手和手臂", "放松腹部", "放松双腿和双脚"],
    guidanceEn: ["Relax your face and jaw", "Tense and release your shoulders", "Relax your hands and arms", "Relax your abdomen", "Relax your legs and feet"],
  },
  {
    id: "eastern_movement",
    title: "东方舒展",
    titleEn: "Eastern-Inspired Stretching",
    description: "结合缓慢伸展与重心觉察，恢复身体的稳定感。",
    descriptionEn: "Combine gentle stretching and balance awareness to regain stability.",
    duration: 148,
    video: "/videos/东方动作.mp4",
    guidance: ["双脚稳定站立", "缓慢抬起双臂", "跟随呼吸舒展身体", "轻轻转移身体重心", "回到自然站姿"],
    guidanceEn: ["Stand with both feet grounded", "Raise your arms slowly", "Stretch with your breath", "Shift your weight gently", "Return to a natural stance"],
  },
  {
    id: "music_relaxation",
    title: "音乐放松",
    titleEn: "Music Relaxation",
    description: "跟随舒缓音乐放慢节奏，让注意力和身体逐渐安定。",
    descriptionEn: "Slow down with calming music and let your attention and body settle.",
    duration: 171,
    video: "/videos/音乐放松训练.mp4",
    guidance: ["找到舒适姿势", "放松肩膀和下颌", "把注意力带到音乐", "允许呼吸自然流动"],
    guidanceEn: ["Find a comfortable posture", "Relax your shoulders and jaw", "Bring attention to the music", "Let your breath flow naturally"],
  },
];

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function TrainingCenter({
  sessionId,
  language = "zh",
  onRecorded,
  onGoChat,
}) {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("select");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [beforeDistress, setBeforeDistress] = useState(6);
  const [afterDistress, setAfterDistress] = useState(4);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEnglish = language === "en";

  useEffect(() => {
    if (!running || !selected) return undefined;
    if (selected.video) return undefined;
    const intervalId = window.setInterval(() => {
      setElapsed((value) => {
        const next = value + 1;
        if (next >= selected.duration) {
          setRunning(false);
          setStep("feedback");
          return selected.duration;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [running, selected]);

  const currentGuidance = useMemo(() => {
    if (!selected) return "";
    const guidance = isEnglish ? selected.guidanceEn : selected.guidance;
    if (selected.id === "breathing") {
      const cycle = elapsed % 12;
      return guidance[cycle < 4 ? 0 : cycle < 6 ? 1 : 2];
    }
    const index = Math.min(
      guidance.length - 1,
      Math.floor((elapsed / selected.duration) * guidance.length),
    );
    return guidance[index];
  }, [elapsed, isEnglish, selected]);

  const startExercise = () => {
    setElapsed(0);
    setError("");
    setStep("active");
    setRunning(true);
  };

  const finishExercise = () => {
    setRunning(false);
    setStep("feedback");
  };

  const saveExercise = async () => {
    if (!selected || !sessionId) return;
    setSaving(true);
    setError("");
    try {
      const record = await recordSelfGuidedTraining(sessionId, {
        technique: isEnglish ? selected.titleEn : selected.title,
        duration_seconds: Math.max(1, elapsed),
        before_distress: beforeDistress,
        after_distress: afterDistress,
        user_feedback: feedback,
      });
      setStep("done");
      onRecorded?.(record);
    } catch {
      setError(isEnglish ? "Unable to save this exercise. Please try again." : "训练记录保存失败，请重试。");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setSelected(null);
    setStep("select");
    setElapsed(0);
    setRunning(false);
    setFeedback("");
    setError("");
  };

  return (
    <div className="h-dvh flex-1 overflow-y-auto px-4 py-8 pb-24 lg:px-8 lg:pb-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Self-guided practice
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-800">
            {isEnglish ? "Practice Together" : "一起练习"}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isEnglish
              ? "Choose a short exercise and record how you feel before and after."
              : "选择一项短练习，并记录练习前后的真实感受。"}
          </p>
        </div>

        {step === "select" && (
          <div className="grid gap-4 md:grid-cols-2">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => setSelected(exercise)}
                className={`rounded-2xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-200 ${
                  selected?.id === exercise.id
                    ? "border-indigo-400 ring-2 ring-indigo-100"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    {isEnglish ? exercise.titleEn : exercise.title}
                  </h3>
                  <span className="text-xs text-gray-400">{formatTime(exercise.duration)}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  {isEnglish ? exercise.descriptionEn : exercise.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {step === "select" && selected && (
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <label className="block text-sm font-medium text-gray-700">
              {isEnglish ? "Current distress level" : "此刻的困扰程度"}：{beforeDistress}/10
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={beforeDistress}
              onChange={(event) => setBeforeDistress(Number(event.target.value))}
              className="mt-3 w-full accent-indigo-500"
            />
            <button
              onClick={startExercise}
              className="mt-4 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600"
            >
              {isEnglish ? "Start exercise" : "开始练习"}
            </button>
          </div>
        )}

        {step === "active" && selected && (
          <div className="mx-auto max-w-xl rounded-3xl border border-gray-100 bg-white p-4 text-center sm:p-8">
            <p className="text-sm text-gray-400">
              {isEnglish ? selected.titleEn : selected.title}
            </p>
            {selected.video ? (
              <video
                key={selected.id}
                src={selected.video}
                controls
                autoPlay
                playsInline
                onPlay={() => setRunning(true)}
                onPause={() => setRunning(false)}
                onTimeUpdate={(event) => {
                  setElapsed(Math.min(
                    selected.duration,
                    Math.floor(event.currentTarget.currentTime),
                  ));
                }}
                onEnded={() => {
                  setElapsed(selected.duration);
                  finishExercise();
                }}
                className="mx-auto my-6 max-h-[50dvh] w-full rounded-2xl bg-black object-contain shadow-sm"
              >
                {isEnglish
                  ? "Your browser does not support video playback."
                  : "当前浏览器不支持视频播放。"}
              </video>
            ) : (
              <div
                className={`mx-auto my-8 flex h-44 w-44 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-transform duration-[2000ms] ${
                  selected.id === "breathing" && elapsed % 12 < 4 ? "scale-110" : "scale-90"
                }`}
              >
                <span className="text-3xl font-semibold">{formatTime(elapsed)}</span>
              </div>
            )}
            <p className="min-h-8 text-lg font-medium text-gray-700">{currentGuidance}</p>
            <p className="mt-2 text-xs text-gray-400">
              {formatTime(Math.max(0, selected.duration - elapsed))} {isEnglish ? "remaining" : "剩余"}
            </p>
            <button
              onClick={finishExercise}
              className="mt-8 rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:border-indigo-200 hover:text-indigo-600"
            >
              {isEnglish ? "Finish now" : "结束练习"}
            </button>
          </div>
        )}

        {step === "feedback" && selected && (
          <div className="mx-auto max-w-xl rounded-3xl border border-gray-100 bg-white p-7">
            <h3 className="text-xl font-semibold text-gray-800">
              {isEnglish ? "How do you feel now?" : "现在感觉如何？"}
            </h3>
            <label className="mt-6 block text-sm font-medium text-gray-700">
              {isEnglish ? "Current distress level" : "现在的困扰程度"}：{afterDistress}/10
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={afterDistress}
              onChange={(event) => setAfterDistress(Number(event.target.value))}
              className="mt-3 w-full accent-indigo-500"
            />
            <label className="mt-5 block text-sm font-medium text-gray-700">
              {isEnglish ? "Optional note" : "补充感受（可选）"}
            </label>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              maxLength={500}
              rows={3}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              placeholder={isEnglish ? "What changed during the exercise?" : "练习中有什么变化？"}
            />
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <button
              onClick={saveExercise}
              disabled={saving}
              className="mt-5 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              {saving
                ? (isEnglish ? "Saving..." : "保存中...")
                : (isEnglish ? "Save record" : "保存训练记录")}
            </button>
          </div>
        )}

        {step === "done" && selected && (
          <div className="mx-auto max-w-xl rounded-3xl border border-green-100 bg-green-50 p-8 text-center">
            <h3 className="text-xl font-semibold text-green-800">
              {isEnglish ? "Exercise completed" : "练习完成"}
            </h3>
            <p className="mt-3 text-sm text-green-700">
              {beforeDistress > afterDistress
                ? (isEnglish ? "Your distress level decreased. This record has been added to Growth." : "困扰程度有所下降，记录已加入成长档案。")
                : (isEnglish ? "Thank you for recording your honest experience." : "谢谢你如实记录这次体验。")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={reset} className="rounded-xl border border-green-200 px-5 py-2.5 text-sm text-green-700">
                {isEnglish ? "Practice again" : "再练一次"}
              </button>
              <button onClick={onGoChat} className="rounded-xl bg-green-600 px-5 py-2.5 text-sm text-white">
                {isEnglish ? "Return to chat" : "回到对话"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
