export default function TypingIndicator() {
  return (
    <div className="flex gap-3 message-bubble">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg shadow-sm">
        🐼
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-gray-300 rounded-full typing-dot"></span>
          <span className="w-2 h-2 bg-gray-300 rounded-full typing-dot"></span>
          <span className="w-2 h-2 bg-gray-300 rounded-full typing-dot"></span>
        </div>
      </div>
    </div>
  );
}
