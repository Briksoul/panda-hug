export default function SuggestionChips({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="px-4 pb-2">
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((text, i) => (
          <button
            key={i}
            onClick={() => onSelect(text)}
            className="max-w-full break-words rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm text-indigo-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 [overflow-wrap:anywhere]"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
