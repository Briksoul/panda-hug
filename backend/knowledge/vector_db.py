"""知识库系统 — 4层向量数据库"""
from __future__ import annotations
import os
from typing import Optional

# 知识库初始数据
PSYCHOLOGICAL_MECHANISMS = [
    {
        "id": "pm_001",
        "content": "孤独感的心理机制：人类有基本的归属需求（Need to Belong）。当社交连接不足时，大脑会激活类似物理疼痛的神经通路，导致真实的痛苦感受。这不是'想太多'，而是正常的生理心理反应。",
        "tags": ["孤独", "归属需求", "社交"],
    },
    {
        "id": "pm_002",
        "content": "焦虑的认知机制：焦虑往往源于对不确定性的过度预测。大脑的威胁检测系统（杏仁核）过度活跃，将模糊信息解读为危险信号。认知行为疗法（CBT）通过识别和挑战这些自动思维来缓解焦虑。",
        "tags": ["焦虑", "CBT", "认知偏差"],
    },
    {
        "id": "pm_003",
        "content": "抑郁的习得性无助模型：当个体反复经历不可控的负面事件时，会形成'无论怎么做都没用'的信念。这种习得性无助会导致动机下降、情绪低落和退缩行为。",
        "tags": ["抑郁", "习得性无助", "动机"],
    },
    {
        "id": "pm_004",
        "content": "文化适应压力（Acculturative Stress）：跨文化环境中的个体需要同时处理语言障碍、文化差异、身份认同冲突等多重压力源。这种持续的认知负荷会导致心理疲惫和情绪问题。",
        "tags": ["跨文化", "留学生", "适应"],
    },
    {
        "id": "pm_005",
        "content": "情绪压抑的代价：在强调'坚强'的文化中，个体倾向于压抑负面情绪。但情绪压抑会增加认知负荷，降低工作记忆容量，并可能导致躯体化症状（头痛、胃痛等）。",
        "tags": ["情绪压抑", "躯体化", "文化"],
    },
]

CULTURAL_FEATURES = [
    {
        "id": "cf_001",
        "content": "集体主义文化中的自我概念：中国人的自我概念更依赖于社会关系（互依型自我）。'面子'不仅是社会评价，更是自我价值感的重要来源。因此人际冲突和社交失败对中国人的情绪影响可能更大。",
        "tags": ["中国", "集体主义", "面子", "自我概念"],
    },
    {
        "id": "cf_002",
        "content": "留学生的情感表达模式：中国留学生往往内化压力，不习惯向他人表达负面情绪。这不意味着他们不需要支持，而是表达方式不同。他们可能通过行为（如回避社交、过度学习）而非语言来表达痛苦。",
        "tags": ["留学生", "情感表达", "内化"],
    },
    {
        "id": "cf_003",
        "content": "美国文化中的心理健康观念：美国文化更接受心理咨询，将寻求帮助视为'自我照顾'而非'软弱'。个人主义文化强调自主性和自我效能，CBT等强调个人控制感的方法更契合。",
        "tags": ["美国", "个人主义", "心理咨询"],
    },
    {
        "id": "cf_004",
        "content": "东方智慧中的心理健康资源：佛学的'正念'（Mindfulness）教人观察念头而不执着；儒家的'慎独'强调自我反省；道家的'无为'提倡顺应自然。这些传统资源可以与现代心理学结合，为有东方文化背景的人提供更亲切的支持。",
        "tags": ["东方", "佛学", "儒家", "道家", "正念"],
    },
]

EVENT_PATTERNS = [
    {
        "id": "ep_001",
        "content": "留学社交孤立事件模式：留学生常常描述'身边很多人但没有知心朋友'的矛盾体验。核心问题不是缺乏社交机会，而是缺乏'被理解'的感觉。解决方案应聚焦于深化少数关系，而非扩大社交圈。",
        "tags": ["留学生", "社交孤立", "被理解"],
    },
    {
        "id": "ep_002",
        "content": "学业压力与自我价值绑定：许多亚洲学生将学业表现与自我价值高度绑定。成绩下滑不仅意味着学业问题，更触发'我辜负了家人期望'的深层恐惧。干预需要帮助区分'能力'和'价值'。",
        "tags": ["学业压力", "自我价值", "期望"],
    },
    {
        "id": "ep_003",
        "content": "家庭关系中的情感勒索：在集体主义文化中，家庭成员可能通过'我为你付出了一切'来施加压力。这种模式让个体在追求个人需求时产生强烈的内疚感。理解这种模式是处理家庭关系压力的第一步。",
        "tags": ["家庭", "内疚", "情感勒索"],
    },
]

CULTURAL_INTERPRETATIONS = [
    {
        "id": "ci_001",
        "content": "从儒家视角理解孤独：儒家强调'仁'——人与人之间的连接。孤独感可以被理解为对'仁'的渴望，这是人性的基本需求。同时，儒家的'慎独'提醒我们，独处也可以是自我修养的机会。",
        "tags": ["儒家", "孤独", "仁", "慎独"],
    },
    {
        "id": "ci_002",
        "content": "从佛学视角理解痛苦：佛学认为痛苦源于'执着'——对特定结果的执念。当我们说'我必须成功''我不能让别人失望'时，我们就在制造痛苦。观照这些念头而不执着，可以减轻心理负担。",
        "tags": ["佛学", "痛苦", "执着", "观照"],
    },
    {
        "id": "ci_003",
        "content": "从CBT视角理解焦虑：焦虑往往源于认知偏差——过度估计负面事件的概率，低估自己的应对能力。'灾难化思维'（如果考试不及格，我的人生就完了）是常见的认知陷阱。识别这些陷阱是改变的第一步。",
        "tags": ["CBT", "焦虑", "灾难化思维", "认知偏差"],
    },
]

# ─── 咨询技术库（V2 新增）───────────────────────────────────
COUNSELING_TECHNIQUES = [
    {
        "id": "ct_001",
        "content": "人本主义疗法核心：无条件积极关注（Unconditional Positive Regard）。咨询师不对用户的想法和感受做评判，而是完全接纳。技术要点：反映性倾听、情感确认、真诚一致。",
        "tags": ["人本主义", "共情", "无条件积极关注"],
    },
    {
        "id": "ct_002",
        "content": "动机式访谈（MI）核心：引导用户自己发现改变的理由，而不是告诉他们应该怎么做。技术要点：开放式提问、肯定、反映性倾听、总结（OARS）。避免直接给建议。",
        "tags": ["MI", "动机式访谈", "开放式提问"],
    },
    {
        "id": "ct_003",
        "content": "叙事疗法核心：问题是问题，人不是问题。帮助用户将问题外化，重新讲述自己的故事。技术要点：外化对话、寻找独特结果、重写故事。",
        "tags": ["叙事疗法", "外化", "重写故事"],
    },
    {
        "id": "ct_004",
        "content": "ACT（接纳承诺疗法）核心：接纳无法控制的情绪，承诺采取符合价值观的行动。六大过程：接纳、认知解离、当下觉察、自我为语境、价值澄清、承诺行动。",
        "tags": ["ACT", "接纳", "认知解离", "价值"],
    },
]

# ─── 危机干预库（V2 新增）───────────────────────────────────
CRISIS_INTERVENTION = [
    {
        "id": "cr_001",
        "content": "Columbia Suicide Severity Rating Scale (C-SSRS) 评估框架：Level 0=无自杀意念，Level 1=被动意念，Level 2=非特异性主动意念，Level 3=有计划的主动意念，Level 4=有意图的主动意念。",
        "tags": ["C-SSRS", "自杀评估", "风险等级"],
    },
    {
        "id": "cr_002",
        "content": "WHO危机干预指南：1. 确保安全 2. 倾听不评判 3. 提供支持 4. 制定安全计划 5. 转介专业资源。关键原则：不要离开处于危机中的用户，直到确认其安全。",
        "tags": ["WHO", "危机干预", "安全计划"],
    },
    {
        "id": "cr_003",
        "content": "危机热线资源（按地区）：中国=12356（全国心理援助热线）、010-82951332（北京）。美国=988（Suicide & Crisis Lifeline）、741741（Crisis Text Line）。英国=116 123（Samaritans）。国际=https://www.iasp.info/resources/Crisis_Centres/",
        "tags": ["热线", "资源", "中国", "美国", "国际"],
    },
]

# ─── 督导规则库（V2 新增）───────────────────────────────────
SUPERVISION_RULES = [
    {
        "id": "sr_001",
        "content": "咨询对话比例规范：共情回应应占60-70%，探索性提问占20-30%，建议和反馈不超过10%。如果AI回复中建议过多，说明'说教'过度，需要调整。",
        "tags": ["比例", "共情", "探索", "说教"],
    },
    {
        "id": "sr_002",
        "content": "咨询师禁忌：1.不要说你应该 2.不要最小化用户感受 3.不要急于给解决方案 4.不要说我理解（用听起来替代）5.不要比较",
        "tags": ["禁忌", "说教", "共情"],
    },
    {
        "id": "sr_003",
        "content": "探索性提问模板：开放性=能多和我说说吗/然后呢？澄清性=你说的具体是指？情感性=当时你是什么感觉？认知性=那时候你脑子里在想什么？社会支持=平时会和谁聊这些？",
        "tags": ["提问", "模板", "探索"],
    },
]


class KnowledgeBase:
    """4层知识库（Phase 1: 内存关键词匹配，Phase 2: ChromaDB 向量检索）"""

    def __init__(self, use_chroma: bool = False):
        self.use_chroma = use_chroma
        self._init_data()

    def _init_data(self):
        """初始化知识库数据"""
        self.layers = {
            "psychological": PSYCHOLOGICAL_MECHANISMS,
            "cultural": CULTURAL_FEATURES,
            "events": EVENT_PATTERNS,
            "interpretations": CULTURAL_INTERPRETATIONS,
            "counseling_techniques": COUNSELING_TECHNIQUES,
            "crisis_intervention": CRISIS_INTERVENTION,
            "supervision_rules": SUPERVISION_RULES,
        }

        if self.use_chroma:
            self._init_chroma()

    def _init_chroma(self):
        """初始化 ChromaDB（Phase 2）"""
        try:
            import chromadb
            from config import config

            client = chromadb.PersistentClient(path=config.CHROMA_PERSIST_DIR)
            self.collections = {}
            for layer_name, data in self.layers.items():
                col = client.get_or_create_collection(name=f"panda_{layer_name}")
                # 如果集合为空，添加初始数据
                if col.count() == 0:
                    for item in data:
                        col.add(
                            ids=[item["id"]],
                            documents=[item["content"]],
                            metadatas=[{"tags": ",".join(item["tags"])}],
                        )
                self.collections[layer_name] = col
        except ImportError:
            self.use_chroma = False

    async def search(
        self,
        query: str,
        cultural_bg: str = "",
        agent_role: str = "",
        top_k: int = 3,
    ) -> str:
        """跨层搜索知识库"""
        results = []

        if self.use_chroma:
            results = self._chroma_search(query, top_k)
        else:
            results = self._keyword_search(query, top_k)

        if not results:
            return ""

        parts = []
        for r in results:
            parts.append(f"[{r['layer']}] {r['content']}")
        return "\n\n".join(parts)

    def _keyword_search(self, query: str, top_k: int) -> list[dict]:
        """关键词匹配搜索"""
        query_lower = query.lower()
        scored = []

        for layer_name, items in self.layers.items():
            for item in items:
                score = 0
                # 标签匹配
                for tag in item["tags"]:
                    if tag in query_lower:
                        score += 2
                # 内容关键词匹配
                content_lower = item["content"].lower()
                for word in query_lower.split():
                    if len(word) > 1 and word in content_lower:
                        score += 1
                if score > 0:
                    scored.append({
                        "layer": layer_name,
                        "content": item["content"],
                        "score": score,
                    })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def _chroma_search(self, query: str, top_k: int) -> list[dict]:
        """向量搜索"""
        results = []
        for layer_name, col in self.collections.items():
            res = col.query(query_texts=[query], n_results=top_k)
            if res["documents"] and res["documents"][0]:
                for doc in res["documents"][0]:
                    results.append({"layer": layer_name, "content": doc})
        return results[:top_k]

    def add_knowledge(self, layer: str, content: str, tags: list[str]):
        """动态添加知识"""
        if layer not in self.layers:
            self.layers[layer] = []

        item_id = f"{layer}_{len(self.layers[layer]):03d}"
        item = {"id": item_id, "content": content, "tags": tags}
        self.layers[layer].append(item)

        if self.use_chroma and layer in self.collections:
            self.collections[layer].add(
                ids=[item_id],
                documents=[content],
                metadatas=[{"tags": ",".join(tags)}],
            )
