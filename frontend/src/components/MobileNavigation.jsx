const items = [
  { id: "chat", label: "对话", icon: "💬" },
  { id: "report", label: "洞察", icon: "🪞" },
  { id: "training", label: "练习", icon: "🧘" },
  { id: "growth", label: "成长", icon: "📈" },
  { id: "new", label: "新建", icon: "＋" },
];

export default function MobileNavigation({
  activeView,
  onNavigate,
  reportReady,
  language = "zh",
}) {
  const englishLabels = {
    chat: "Chat",
    report: "Insight",
    training: "Practice",
    growth: "Growth",
    new: "New",
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-1 pt-2 backdrop-blur lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center">
        {items.map((item) => {
          const disabled = item.id === "report" && !reportReady;
          return (
            <button
              key={item.id}
              onClick={() => !disabled && onNavigate(item.id)}
              disabled={disabled}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] transition-colors ${
                activeView === item.id
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-400"
              } disabled:opacity-35`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="whitespace-nowrap">
                {language === "en" ? englishLabels[item.id] : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
