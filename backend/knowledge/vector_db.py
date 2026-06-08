"""
知识库系统 V4 — 6层 RAG 知识库
支持关键词匹配 + ChromaDB 向量检索
"""
from __future__ import annotations
import json
import os
from pathlib import Path
from typing import Optional

PARSED_DIR = Path(__file__).parent / "parsed"

# ─── 知识库层名映射 ─────────────────────────────────────────
KB_LAYERS = {
    "psych_science": "心理科普库",
    "counseling_techniques": "心理咨询技术库",
    "psych_mechanisms": "心理机制库",
    "cultural_features": "文化特征库",
    "event_library": "事件库",
    "crisis_library": "危机转介库",
}

# ─── Agent-知识库映射 ────────────────────────────────────────
AGENT_KB_MAP = {
    "cognitive_orchestrator": ["psych_science"],
    "counselor": ["counseling_techniques", "psych_mechanisms", "event_library", "cultural_features"],
    "sensing": ["psych_science"],
    "risk": ["crisis_library"],
    "case_formulation": ["event_library", "psych_mechanisms", "cultural_features"],
    "insight_report": ["event_library", "psych_mechanisms", "cultural_features"],
    "coach": ["psych_science", "counseling_techniques"],
}


class KnowledgeBase:
    """6层 RAG 知识库"""

    def __init__(self, use_chroma: bool = False):
        self.use_chroma = use_chroma
        self.layers: dict[str, list[dict]] = {}
        self._load_parsed_data()

    def _load_parsed_data(self):
        """加载解析后的知识库数据"""
        for layer_name in KB_LAYERS:
            json_path = PARSED_DIR / f"{layer_name}.json"
            if json_path.exists():
                self.layers[layer_name] = json.loads(json_path.read_text(encoding="utf-8"))
            else:
                self.layers[layer_name] = []

        if self.use_chroma:
            self._init_chroma()

    def _init_chroma(self):
        """初始化 ChromaDB 向量检索"""
        try:
            import chromadb
            from config import config

            client = chromadb.PersistentClient(path=config.CHROMA_PERSIST_DIR)
            self.collections = {}
            for layer_name, data in self.layers.items():
                if not data:
                    continue
                col = client.get_or_create_collection(name=f"panda_v4_{layer_name}")
                # 如果集合为空，添加数据
                if col.count() == 0:
                    for item in data:
                        col.add(
                            ids=[item["id"]],
                            documents=[item["content"]],
                            metadatas=[{"tags": ",".join(item.get("tags", [])), "source": item.get("source", "")}],
                        )
                self.collections[layer_name] = col
        except ImportError:
            self.use_chroma = False

    async def search(
        self,
        query: str,
        cultural_bg: str = "",
        agent_role: str = "",
        top_k: int = 5,
    ) -> str:
        """跨层搜索知识库"""
        # 确定要搜索的知识库层
        target_layers = AGENT_KB_MAP.get(agent_role, list(self.layers.keys()))

        results = []
        if self.use_chroma:
            results = self._chroma_search(query, target_layers, top_k)
        else:
            results = self._keyword_search(query, target_layers, top_k)

        if not results:
            return ""

        parts = []
        for r in results:
            parts.append(f"[{r.get('source', r.get('layer', ''))}] {r['content'][:500]}")
        return "\n\n".join(parts)

    def _keyword_search(self, query: str, target_layers: list[str], top_k: int) -> list[dict]:
        """关键词匹配搜索"""
        query_lower = query.lower()
        scored = []

        for layer_name in target_layers:
            items = self.layers.get(layer_name, [])
            for item in items:
                score = 0
                # 标签匹配（权重高）
                for tag in item.get("tags", []):
                    if tag.lower() in query_lower:
                        score += 3
                # 内容关键词匹配
                content_lower = item["content"].lower()
                for word in query_lower.split():
                    if len(word) > 1 and word in content_lower:
                        score += 1
                # 维度/主题匹配
                for key in ["topic", "technique", "section", "event", "dimension"]:
                    if key in item and item[key]:
                        if any(w in item[key].lower() for w in query_lower.split() if len(w) > 1):
                            score += 2

                if score > 0:
                    scored.append({
                        "layer": layer_name,
                        "source": item.get("source", KB_LAYERS.get(layer_name, layer_name)),
                        "content": item["content"],
                        "score": score,
                    })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def _chroma_search(self, query: str, target_layers: list[str], top_k: int) -> list[dict]:
        """向量搜索"""
        results = []
        for layer_name in target_layers:
            if layer_name not in self.collections:
                continue
            col = self.collections[layer_name]
            res = col.query(query_texts=[query], n_results=min(top_k, 3))
            if res["documents"] and res["documents"][0]:
                for doc in res["documents"][0]:
                    results.append({
                        "layer": layer_name,
                        "source": KB_LAYERS.get(layer_name, layer_name),
                        "content": doc,
                    })
        return results[:top_k]

    def add_knowledge(self, layer: str, content: str, tags: list[str]):
        """动态添加知识"""
        if layer not in self.layers:
            self.layers[layer] = []

        item_id = f"{layer}_{len(self.layers[layer]):03d}"
        item = {"id": item_id, "content": content, "tags": tags, "source": KB_LAYERS.get(layer, layer)}
        self.layers[layer].append(item)

        if self.use_chroma and layer in self.collections:
            self.collections[layer].add(
                ids=[item_id],
                documents=[content],
                metadatas=[{"tags": ",".join(tags), "source": item.get("source", "")}],
            )

    def get_layer_stats(self) -> dict:
        """获取各层统计"""
        return {name: len(items) for name, items in self.layers.items()}
