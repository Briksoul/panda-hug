export default function CrisisAlert({ message, onSelect }) {
  if (!message) return null;

  return (
    <div className="crisis-alert mx-0 my-4 rounded-2xl border-2 border-red-300 bg-red-50 p-4 shadow-lg sm:mx-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">🚨</span>
        <div className="min-w-0 flex-1">
          {/* 标题 */}
          <h3 className="text-lg font-bold text-red-700 mb-2">
            安全守护已启动
          </h3>

          {/* 热线信息 */}
          <div className="mb-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-red-800 [overflow-wrap:anywhere]">
            {message.content}
          </div>

          {/* 操作按钮 */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((text, i) => (
                <button
                  key={i}
                  onClick={() => onSelect?.(text)}
                  className="max-w-full break-words rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 [overflow-wrap:anywhere]"
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
