import { useState } from "react";

export default function WelcomeScreen({ onStart, loading }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart(name);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="text-center max-w-md mx-auto px-6">
        {/* 熊猫 Logo */}
        <div className="text-8xl mb-6 breathe-animation">🐼</div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Panda Hug
        </h1>
        <p className="text-gray-500 mb-2 text-lg">温暖跨文化心理伴侣</p>
        <p className="text-gray-400 mb-10 text-sm">
          A safe space for your mind, across cultures.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的名字（选填）"
            className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-center text-lg transition-all bg-white/80 backdrop-blur"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? "正在连接..." : "开始对话 🐼"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-8 leading-relaxed">
          🔒 你的对话内容完全保密<br />
          如遇紧急情况，请拨打 400-161-9995
        </p>
      </div>
    </div>
  );
}
