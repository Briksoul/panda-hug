export default function SuggestionChips({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="px-4 pb-2">
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((text, i) => (
          <button
            key={i}
            onClick={() => onSelect(text)}
            className="px-4 py-2 rounded-full text-sm bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
