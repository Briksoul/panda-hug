import { useState } from "react";

const categories = [
  { id: "psych_science", emoji: "🧠", zh: "心理科普", en: "Psychology Science", desc: "积极心理学、正念、情绪调节" },
  { id: "counseling_techniques", emoji: "💬", zh: "咨询技术", en: "Counseling Techniques", desc: "咨询师话术、共情技术" },
  { id: "psych_mechanisms", emoji: "⚙️", zh: "心理机制", en: "Psych Mechanisms", desc: "心理学理论、发展心理学" },
  { id: "cultural_features", emoji: "🌍", zh: "文化特征", en: "Cultural Features", desc: "中国/美国/留学生文化特征" },
  { id: "event_library", emoji: "📋", zh: "事件库", en: "Event Library", desc: "学业、社交、家庭等压力事件" },
  { id: "crisis_library", emoji: "🛡️", zh: "危机转介", en: "Crisis Resources", desc: "危机干预资源、热线电话" },
];

export default function Knowledge({ language }) {
  const isZh = language === "zh";
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (cat) => {
    setSelected(cat);
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge/${cat.id}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {!selected ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#3a2a1a] mb-2">
              {isZh ? "📖 心理知识库" : "📖 Psychology Knowledge Base"}
            </h1>
            <p className="text-[#6a5a4a]">
              {isZh ? "探索专业的心理学知识" : "Explore professional psychology knowledge"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat)}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-[#e8ddd0] shadow-sm hover:shadow-md hover:scale-[1.03] transition-all"
              >
                <span className="text-4xl">{cat.emoji}</span>
                <h3 className="text-lg font-bold text-[#3a2a1a]">
                  {isZh ? cat.zh : cat.en}
                </h3>
                <p className="text-sm text-[#8a7a6a] text-center">{cat.desc}</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => { setSelected(null); setItems([]); }}
            className="mb-6 px-4 py-2 rounded-lg text-sm text-[#8a7a6a] hover:text-[#5a4a3a] hover:bg-[#f5efe6] border border-[#e8ddd0] transition-all"
          >
            ← {isZh ? "返回" : "Back"}
          </button>
          <h2 className="text-2xl font-bold text-[#3a2a1a] mb-6">
            {selected.emoji} {isZh ? selected.zh : selected.en}
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🐼</div>
              <p className="text-[#8a7a6a]">{isZh ? "加载中..." : "Loading..."}</p>
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-[#e8ddd0] shadow-sm">
                  {item.topic && (
                    <h3 className="font-bold text-[#3a2a1a] mb-2">{item.topic}</h3>
                  )}
                  {item.technique && (
                    <h3 className="font-bold text-[#3a2a1a] mb-2">{item.technique}</h3>
                  )}
                  {item.section && (
                    <h3 className="font-bold text-[#3a2a1a] mb-2">{item.section}</h3>
                  )}
                  {item.event && (
                    <h3 className="font-bold text-[#3a2a1a] mb-2">{item.event}</h3>
                  )}
                  <p className="text-[#5a4a3a] whitespace-pre-wrap text-sm leading-relaxed">
                    {item.content?.substring(0, 500)}{item.content?.length > 500 ? "..." : ""}
                  </p>
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.tags.slice(0, 5).map((tag, j) => (
                        <span key={j} className="px-2 py-1 bg-[#faf6f0] text-[#8a7a6a] rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#8a7a6a]">{isZh ? "暂无数据" : "No data available"}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
