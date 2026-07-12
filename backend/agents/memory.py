"""Persistent cross-session memory for Panda Hug users."""
from __future__ import annotations

import json
import time
from collections import Counter
from datetime import date, datetime, timedelta
from pathlib import Path

from .base import AgentRole, UserProfile


DEFAULT_USERS_DIR = Path(__file__).parent.parent / "data" / "users"
ISSUE_KEYWORDS = {
    "学业与工作": ["学习", "学业", "考试", "成绩", "论文", "导师", "课堂", "工作", "study", "exam", "work"],
    "人际与社交": ["朋友", "同学", "室友", "社交", "关系", "沟通", "friend", "social", "roommate"],
    "家庭与期待": ["父母", "家庭", "家人", "期待", "family", "parent"],
    "文化适应": ["文化", "留学", "语言", "适应", "中国", "美国", "culture", "language", "abroad"],
    "孤独与归属": ["孤独", "想家", "归属", "没人理解", "lonely", "homesick", "belong"],
    "情绪与睡眠": ["焦虑", "抑郁", "压力", "失眠", "情绪", "anxiety", "depress", "stress", "sleep"],
}

PERMA_DEFAULTS = {
    "positive_emotion": 50.0,
    "engagement": 50.0,
    "relationships": 50.0,
    "meaning": 50.0,
    "accomplishment": 50.0,
}


class MemoryAgent:
    role = AgentRole.MEMORY

    def __init__(self, storage_dir: Path | None = None):
        self.storage_dir = storage_dir or DEFAULT_USERS_DIR
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def register_session(
        self,
        profile: UserProfile,
        session_id: str,
    ) -> dict:
        memory = self.get_memory(profile.user_id)
        if session_id not in memory["sessions"]:
            memory["sessions"].append(session_id)
        self._update_profile(memory, profile)
        memory["last_active"] = time.time()
        memory["dynamic_summary"] = self._build_summary(memory)
        self._save(profile.user_id, memory)
        return memory

    def record_turn(
        self,
        profile: UserProfile,
        session_id: str,
        user_message: str,
        assistant_response: str,
        agent: str,
        sensing: dict,
        case_formulation: dict | None = None,
        cultural_analysis: dict | None = None,
        insight_report: dict | None = None,
        training_record: dict | None = None,
    ) -> dict:
        memory = self.get_memory(profile.user_id)
        if session_id not in memory["sessions"]:
            memory["sessions"].append(session_id)

        now = time.time()
        memory["observations"].append({
            "timestamp": now,
            "session_id": session_id,
            "agent": agent,
            "user_message": user_message[:1000],
            "assistant_response": assistant_response[:1000],
        })
        voice_analysis = sensing.get("voice_analysis")
        emotion_record = {
            "timestamp": now,
            "session_id": session_id,
            "sentiment": sensing.get("sentiment", "neutral"),
            "emotion_tags": sensing.get("emotion_tags", []),
            "intensity": sensing.get("intensity", 0.0),
            "emotion_level": profile.emotion_level.value,
            "source": sensing.get("source", "text"),
        }
        if voice_analysis:
            emotion_record["voice_analysis"] = {
                "provider": voice_analysis.get("provider", "hume"),
                "top_emotions": voice_analysis.get("top_emotions", []),
                "psychological_signals": voice_analysis.get(
                    "psychological_signals",
                    {},
                ),
                "text_voice_incongruent": voice_analysis.get(
                    "text_voice_incongruent",
                    False,
                ),
            }
            memory["voice_analyses"].append({
                "timestamp": now,
                "session_id": session_id,
                "transcript": user_message[:1000],
                **voice_analysis,
            })
        memory["emotion_history"].append(emotion_record)

        if case_formulation:
            memory["latest_case_formulation"] = case_formulation
        if cultural_analysis:
            memory["latest_cultural_analysis"] = cultural_analysis
        if insight_report and (
            not memory["insight_reports"]
            or memory["insight_reports"][-1].get("session_id") != session_id
        ):
            memory["insight_reports"].append({
                "timestamp": now,
                "session_id": session_id,
                "report": insight_report,
            })
        if training_record:
            memory["training_records"].append({
                **training_record,
                "session_id": session_id,
            })
            self._apply_training_to_perma(memory, training_record)

        memory["observations"] = memory["observations"][-200:]
        memory["emotion_history"] = memory["emotion_history"][-500:]
        memory["voice_analyses"] = memory["voice_analyses"][-200:]
        memory["insight_reports"] = memory["insight_reports"][-50:]
        memory["training_records"] = memory["training_records"][-100:]
        memory["last_active"] = now
        self._update_profile(memory, profile)
        memory["dynamic_summary"] = self._build_summary(memory)
        self._save(profile.user_id, memory)
        return memory

    def record_voice_analysis(
        self,
        profile: UserProfile,
        session_id: str,
        transcript: str,
        sensing: dict,
        analysis: dict,
    ) -> dict:
        memory = self.get_memory(profile.user_id)
        if session_id not in memory["sessions"]:
            memory["sessions"].append(session_id)

        now = time.time()
        record = {
            "timestamp": now,
            "session_id": session_id,
            "transcript": transcript[:1000],
            **analysis,
        }
        memory["voice_analyses"].append(record)
        memory["emotion_history"].append({
            "timestamp": now,
            "session_id": session_id,
            "sentiment": sensing.get("sentiment", "neutral"),
            "emotion_tags": sensing.get("emotion_tags", []),
            "intensity": sensing.get("intensity", 0.0),
            "emotion_level": profile.emotion_level.value,
            "source": "voice",
            "voice_analysis": {
                "provider": analysis.get("provider", "hume"),
                "top_emotions": analysis.get("top_emotions", []),
                "psychological_signals": analysis.get(
                    "psychological_signals",
                    {},
                ),
                "text_voice_incongruent": analysis.get(
                    "text_voice_incongruent",
                    False,
                ),
            },
        })
        memory["observations"].append({
            "timestamp": now,
            "session_id": session_id,
            "agent": AgentRole.SENSING.value,
            "user_message": transcript[:1000],
            "assistant_response": "",
        })

        memory["voice_analyses"] = memory["voice_analyses"][-200:]
        memory["emotion_history"] = memory["emotion_history"][-500:]
        memory["observations"] = memory["observations"][-200:]
        memory["last_active"] = now
        self._update_profile(memory, profile)
        memory["dynamic_summary"] = self._build_summary(memory)
        self._save(profile.user_id, memory)
        return memory

    def record_report(
        self,
        profile: UserProfile,
        session_id: str,
        report: dict,
    ) -> dict:
        memory = self.get_memory(profile.user_id)
        now = time.time()
        existing = next(
            (
                item for item in memory["insight_reports"]
                if item.get("session_id") == session_id
            ),
            None,
        )
        if existing:
            existing.update({"timestamp": now, "report": report})
        else:
            memory["insight_reports"].append({
                "timestamp": now,
                "session_id": session_id,
                "report": report,
            })
        memory["insight_reports"] = memory["insight_reports"][-50:]
        memory["last_active"] = now
        self._update_profile(memory, profile)
        memory["dynamic_summary"] = self._build_summary(memory)
        self._save(profile.user_id, memory)
        return memory

    def record_training(
        self,
        profile: UserProfile,
        session_id: str,
        training_record: dict,
    ) -> dict:
        memory = self.get_memory(profile.user_id)
        memory["training_records"].append({
            **training_record,
            "session_id": session_id,
        })
        self._apply_training_to_perma(memory, training_record)
        memory["training_records"] = memory["training_records"][-100:]
        memory["last_active"] = time.time()
        self._update_profile(memory, profile)
        memory["dynamic_summary"] = self._build_summary(memory)
        self._save(profile.user_id, memory)
        return memory

    def get_memory(self, user_id: str) -> dict:
        path = self._path(user_id)
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                return self._with_defaults(user_id, data)
            except (json.JSONDecodeError, OSError):
                pass
        return self._with_defaults(user_id, {})

    def get_summary(self, user_id: str) -> str:
        return self.get_memory(user_id).get("dynamic_summary", "")

    def get_growth_record(self, user_id: str) -> dict:
        memory = self.get_memory(user_id)
        emotion_history = sorted(
            memory.get("emotion_history", []),
            key=lambda item: item.get("timestamp", 0),
        )
        voice_analyses = sorted(
            memory.get("voice_analyses", []),
            key=lambda item: item.get("timestamp", 0),
        )
        training_records = sorted(
            memory.get("training_records", []),
            key=lambda item: item.get("completed_at", 0),
        )
        report_dates = Counter(
            self._date_string(item.get("timestamp", 0))
            for item in memory.get("insight_reports", [])
        )
        training_dates = Counter(
            self._date_string(item.get("completed_at", 0))
            for item in training_records
        )

        daily_emotions: dict[str, list[float]] = {}
        trend = []
        for item in emotion_history[-90:]:
            day = self._date_string(item.get("timestamp", 0))
            distress = self._distress_score(item)
            daily_emotions.setdefault(day, []).append(distress)
            trend.append({
                "timestamp": item.get("timestamp", 0),
                "date": day,
                "distress_index": distress,
                "intensity": round(float(item.get("intensity", 0)) * 100, 1),
                "sentiment": item.get("sentiment", "neutral"),
                "emotion_tags": item.get("emotion_tags", []),
                "source": item.get("source", "text"),
                "voice_analysis": item.get("voice_analysis"),
            })

        calendar = []
        for day in sorted(
            set(daily_emotions) | set(report_dates) | set(training_dates)
        ):
            values = daily_emotions.get(day, [])
            average_distress = round(sum(values) / len(values), 1) if values else None
            calendar.append({
                "date": day,
                "average_distress": average_distress,
                "bear_status": self._bear_status(average_distress),
                "report_count": report_dates[day],
                "training_count": training_dates[day],
            })

        issue_counts = Counter()
        for observation in memory.get("observations", []):
            message = observation.get("user_message", "").lower()
            for category, keywords in ISSUE_KEYWORDS.items():
                if any(keyword in message for keyword in keywords):
                    issue_counts[category] += 1

        first_active = float(memory.get("created_at", time.time()))
        interaction_days = max(
            1,
            int((time.time() - first_active) / 86400) + 1,
        )
        interaction_level = self._interaction_level(interaction_days)
        low_mood_days = self._consecutive_low_mood_days(calendar)
        perma = {
            **PERMA_DEFAULTS,
            **memory.get("perma", {}),
        }
        perma_score = round(sum(perma.values()) / len(perma), 1)

        return {
            "user_id": user_id,
            "summary": memory.get("dynamic_summary", ""),
            "metrics": {
                "session_count": len(memory.get("sessions", [])),
                "interaction_count": len(memory.get("observations", [])),
                "training_count": len(training_records),
                "report_count": len(memory.get("insight_reports", [])),
                "voice_analysis_count": len(voice_analyses),
                "interaction_days": interaction_days,
                "low_mood_days": low_mood_days,
            },
            "interaction_level": interaction_level,
            "adaptation_curve": self._adaptation_curve(memory),
            "perma": {
                "dimensions": perma,
                "overall_score": perma_score,
                "history": memory.get("perma_history", [])[-30:],
                "source": "训练反馈推断，非临床量表",
            },
            "calendar": calendar[-90:],
            "emotion_trend": trend,
            "issue_distribution": [
                {"category": category, "count": count}
                for category, count in issue_counts.most_common()
            ],
            "training_effects": [
                {
                    "date": self._date_string(item.get("completed_at", 0)),
                    "technique": item.get("technique", ""),
                    "improvement": item.get("improvement", ""),
                    "user_feedback": item.get("user_feedback", ""),
                    "before": item.get("before", {}),
                    "after": item.get("after", {}),
                    "distress_change": item.get("distress_change", 0),
                }
                for item in training_records[-30:]
            ],
            "voice_insights": {
                "count": len(voice_analyses),
                "latest": voice_analyses[-1] if voice_analyses else None,
                "recent": voice_analyses[-20:],
                "disclaimer": "声学表达趋势仅作辅助参考，不构成临床诊断。",
            },
            "data_sources": {
                "text": any(
                    item.get("source", "text") == "text"
                    for item in emotion_history
                ),
                "voice": any(
                    item.get("source") == "voice"
                    for item in emotion_history
                ),
                "acoustic": any(
                    bool(item.get("voice_analysis"))
                    for item in emotion_history
                ),
            },
            "care_alert": {
                "triggered": low_mood_days >= 14,
                "reason": "连续14天情绪持续低落" if low_mood_days >= 14 else "",
            },
        }

    def _save(self, user_id: str, memory: dict) -> None:
        path = self._path(user_id)
        temporary_path = path.with_suffix(".tmp")
        temporary_path.write_text(
            json.dumps(memory, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        temporary_path.replace(path)

    def _path(self, user_id: str) -> Path:
        safe_user_id = "".join(
            character for character in user_id
            if character.isalnum() or character in ("-", "_")
        )
        return self.storage_dir / f"{safe_user_id or 'anonymous'}.json"

    @staticmethod
    def _with_defaults(user_id: str, memory: dict) -> dict:
        defaults = {
            "user_id": user_id,
            "profile": {},
            "sessions": [],
            "observations": [],
            "emotion_history": [],
            "voice_analyses": [],
            "latest_case_formulation": {},
            "latest_cultural_analysis": {},
            "insight_reports": [],
            "training_records": [],
            "perma": dict(PERMA_DEFAULTS),
            "perma_history": [],
            "dynamic_summary": "",
            "created_at": time.time(),
            "last_active": time.time(),
        }
        return {**defaults, **memory, "user_id": user_id}

    @staticmethod
    def _apply_training_to_perma(
        memory: dict,
        training_record: dict,
    ) -> None:
        perma = {
            **PERMA_DEFAULTS,
            **memory.get("perma", {}),
        }
        technique = training_record.get("technique", "").lower()
        distress_change = float(training_record.get("distress_change", 0))
        effect = max(-6.0, min(10.0, distress_change / 5))
        if effect == 0:
            effect = 1.0

        deltas = {
            "positive_emotion": effect * 0.7,
            "engagement": effect * 0.35,
            "relationships": 0.0,
            "meaning": 0.0,
            "accomplishment": max(1.0, effect * 0.45),
        }
        if any(word in technique for word in ("正念", "mindful")):
            deltas["engagement"] += max(1.0, effect * 0.35)
            deltas["meaning"] += max(1.0, effect * 0.3)
        if any(word in technique for word in ("东方", "太极", "八段锦", "eastern")):
            deltas["meaning"] += max(1.0, effect * 0.45)
            deltas["engagement"] += max(1.0, effect * 0.2)
        if any(word in technique for word in ("社交", "关系", "role", "social")):
            deltas["relationships"] += max(1.0, effect * 0.7)
        if any(word in technique for word in ("感恩", "gratitude", "音乐", "music")):
            deltas["positive_emotion"] += max(1.0, effect * 0.3)
            deltas["meaning"] += max(1.0, effect * 0.25)

        for dimension, delta in deltas.items():
            perma[dimension] = round(
                max(0.0, min(100.0, perma[dimension] + delta)),
                1,
            )
        memory["perma"] = perma
        memory.setdefault("perma_history", []).append({
            "timestamp": training_record.get("completed_at", time.time()),
            "technique": training_record.get("technique", ""),
            "dimensions": dict(perma),
            "overall_score": round(sum(perma.values()) / len(perma), 1),
        })
        memory["perma_history"] = memory["perma_history"][-100:]

    @staticmethod
    def _adaptation_curve(memory: dict) -> dict:
        profile = memory.get("profile", {})
        months = max(0, int(profile.get("study_abroad_months", 0) or 0))
        adaptation_stage = profile.get("adaptation_stage", "unknown")
        score = int(profile.get("phq2_score", 0)) + int(
            profile.get("gad2_score", 0)
        )

        stage_map = {
            "honeymoon": "honeymoon",
            "culture_shock": "culture_shock",
            "recovery": "recovery",
            "adjustment": "adjustment",
        }
        source = "cultural_agent"
        stage = stage_map.get(adaptation_stage)
        if not stage:
            source = "timeline_estimate"
            if months <= 0:
                stage = "unknown"
            elif months <= 6:
                stage = "culture_shock" if score >= 4 else "honeymoon"
            elif months <= 18:
                stage = "culture_shock" if score >= 4 else "recovery"
            else:
                stage = "recovery" if score >= 4 else "adjustment"

        details = {
            "unknown": (
                "阶段待了解",
                "需要更多跨文化生活信息来判断当前阶段。",
                "继续记录重要事件和情绪变化。",
                50,
            ),
            "honeymoon": (
                "蜜月期",
                "对新环境保持好奇和积极期待，同时仍在建立稳定日常。",
                "在新鲜感之外建立可持续的生活节奏。",
                86,
            ),
            "culture_shock": (
                "文化冲击期",
                "差异、孤独或沟通压力可能变得更加明显。",
                "降低自我责备，主动连接支持资源。",
                36,
            ),
            "recovery": (
                "恢复期",
                "正在形成新的理解方式，并逐渐找回掌控感。",
                "巩固有效策略，允许适应过程出现反复。",
                62,
            ),
            "adjustment": (
                "稳定适应期",
                "能够更灵活地理解并连接不同文化环境。",
                "继续维持归属感、边界和支持网络。",
                82,
            ),
        }
        label, description, tip, baseline = details[stage]
        wellbeing_index = round(
            max(10.0, min(95.0, baseline - max(0, score - 2) * 3)),
            1,
        )
        return {
            "stage": stage,
            "label": label,
            "description": description,
            "tip": tip,
            "source": source,
            "months": months,
            "current": {
                "month": min(months, 30),
                "wellbeing_index": wellbeing_index,
            },
            "curve_points": [
                {"month": 0, "wellbeing_index": 72},
                {"month": 3, "wellbeing_index": 88},
                {"month": 9, "wellbeing_index": 34},
                {"month": 18, "wellbeing_index": 61},
                {"month": 30, "wellbeing_index": 82},
            ],
        }

    @staticmethod
    def _update_profile(memory: dict, profile: UserProfile) -> None:
        memory["profile"] = {
            "name": profile.name,
            "cultural_bg": profile.cultural_bg.value,
            "cultural_identity": profile.cultural_identity.value,
            "adaptation_stage": profile.adaptation_stage.value,
            "phq2_score": profile.phq2_score,
            "gad2_score": profile.gad2_score,
            "emotion_level": profile.emotion_level.value,
            "crisis_triggered": profile.crisis_triggered,
            "tags": profile.tags,
            "language": profile.language,
            "study_abroad_months": profile.study_abroad_months,
        }

    @staticmethod
    def _build_summary(memory: dict) -> str:
        profile = memory.get("profile", {})
        recent_emotions = memory.get("emotion_history", [])[-20:]
        sentiments = Counter(
            item.get("sentiment", "neutral") for item in recent_emotions
        )
        emotion_tags = Counter(
            tag
            for item in recent_emotions
            for tag in item.get("emotion_tags", [])
        )
        dominant_sentiment = (
            sentiments.most_common(1)[0][0] if sentiments else "暂无"
        )
        dominant_tags = "、".join(
            tag for tag, _ in emotion_tags.most_common(3)
        ) or "暂无"
        latest_case = memory.get("latest_case_formulation", {})
        latest_issue = (
            latest_case.get("core_event")
            or memory.get("latest_cultural_analysis", {}).get("core_issue")
            or "暂无"
        )
        return (
            f"累计会话 {len(memory.get('sessions', []))} 次，"
            f"记录互动 {len(memory.get('observations', []))} 轮；"
            f"近期主要情绪倾向：{dominant_sentiment}，"
            f"高频情绪：{dominant_tags}；"
            f"最近核心议题：{latest_issue}；"
            f"文化身份：{profile.get('cultural_identity', 'unknown')}，"
            f"文化适应阶段：{profile.get('adaptation_stage', 'unknown')}；"
            f"已完成训练 {len(memory.get('training_records', []))} 次。"
        )

    @staticmethod
    def _date_string(timestamp: float) -> str:
        return datetime.fromtimestamp(timestamp or time.time()).date().isoformat()

    @staticmethod
    def _distress_score(item: dict) -> float:
        intensity = max(0.0, min(1.0, float(item.get("intensity", 0))))
        sentiment = item.get("sentiment", "neutral")
        if sentiment == "negative":
            score = 45 + intensity * 55
        elif sentiment == "positive":
            score = 20 - intensity * 15
        else:
            score = 25 + intensity * 25
        return round(max(0.0, min(100.0, score)), 1)

    @staticmethod
    def _bear_status(average_distress: float | None) -> str:
        if average_distress is None:
            return "暂无记录"
        if average_distress >= 80:
            return "需要守护"
        if average_distress >= 60:
            return "有些低落"
        if average_distress >= 40:
            return "略显疲惫"
        if average_distress >= 20:
            return "比较平静"
        return "充满活力"

    @staticmethod
    def _interaction_level(interaction_days: int) -> dict:
        if interaction_days <= 14:
            return {"level": 1, "label": "初识伙伴", "range": "1–14天", "next_at": 15}
        if interaction_days <= 30:
            return {"level": 2, "label": "熟悉伙伴", "range": "15–30天", "next_at": 31}
        if interaction_days <= 60:
            return {"level": 3, "label": "默契伙伴", "range": "31–60天", "next_at": 61}
        return {"level": 4, "label": "深度伙伴", "range": "61–90天及以上", "next_at": None}

    @staticmethod
    def _consecutive_low_mood_days(calendar: list[dict]) -> int:
        dated_entries = [
            entry for entry in calendar
            if entry.get("average_distress") is not None
        ]
        if not dated_entries:
            return 0

        count = 0
        expected_date = date.fromisoformat(dated_entries[-1]["date"])
        for entry in reversed(dated_entries):
            entry_date = date.fromisoformat(entry["date"])
            if entry_date != expected_date or entry["average_distress"] < 60:
                break
            count += 1
            expected_date -= timedelta(days=1)
        return count
