export default function CrisisAlert({ message }) {
  if (!message) return null;

  return (
    <div className="mx-4 my-4 rounded-2xl border-2 border-red-300 bg-red-50 p-5 shadow-lg crisis-alert">
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">🚨</span>
        <div className="flex-1">
          {/* 标题 */}
          <h3 className="text-lg font-bold text-red-700 mb-2">
            安全守护已启动
          </h3>

          {/* 热线信息 */}
          <div className="text-sm text-red-800 whitespace-pre-wrap leading-relaxed mb-4">
            {message.content}
          </div>

          {/* 操作按钮 */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((text, i) => (
                <button
                  key={i}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-all shadow-sm"
                >
                  {text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
