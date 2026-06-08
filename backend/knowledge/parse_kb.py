"""
知识库解析器 — 将6个docx知识库文件解析为结构化JSON
用于 Panda Hug V4 RAG 系统
"""
import json
import os
from pathlib import Path
from docx import Document

KB_DIR = Path.home() / "Desktop" / "panda hug"
OUTPUT_DIR = Path(__file__).parent / "parsed"
OUTPUT_DIR.mkdir(exist_ok=True)


def parse_psych_science():
    """1心理科普库 — 纯文本段落，按主题分组"""
    doc = Document(KB_DIR / "1心理科普库.docx")
    entries = []
    current_topic = ""
    current_items = []
    
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        # 检测主题标题（如"一、积极心理学（Seligman）"）
        if text.startswith(("一、", "二、", "三、", "四、", "五、", "六、", "七、", "八、", "九、", "十、")):
            if current_topic and current_items:
                entries.append({
                    "id": f"ps_{len(entries):03d}",
                    "topic": current_topic,
                    "content": "\n".join(current_items),
                    "tags": _extract_tags(current_topic + " " + " ".join(current_items)),
                    "source": "心理科普库"
                })
            current_topic = text
            current_items = []
        else:
            current_items.append(text)
    
    # 最后一组
    if current_topic and current_items:
        entries.append({
            "id": f"ps_{len(entries):03d}",
            "topic": current_topic,
            "content": "\n".join(current_items),
            "tags": _extract_tags(current_topic + " " + " ".join(current_items)),
            "source": "心理科普库"
        })
    
    return entries


def parse_counseling_techniques():
    """2心理技巧库 — textutil转换的文本，按编号分组"""
    import subprocess
    result = subprocess.run(
        ['textutil', '-convert', 'txt', '-stdout', str(KB_DIR / "2心理技巧库.doc")],
        capture_output=True, text=True
    )
    lines = result.stdout.strip().split('\n')
    
    entries = []
    current_technique = ""
    current_items = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # 检测技术标题（如"1. 积极关注（Positive Regard）"）
        if line[0].isdigit() and '.' in line[:5]:
            if current_technique and current_items:
                entries.append({
                    "id": f"ct_{len(entries):03d}",
                    "technique": current_technique,
                    "content": "\n".join(current_items),
                    "tags": _extract_tags(current_technique + " " + " ".join(current_items)),
                    "source": "心理咨询技术库"
                })
            current_technique = line
            current_items = []
        elif line.startswith(("咨询师话术", "技术", "方法")):
            continue
        else:
            current_items.append(line)
    
    if current_technique and current_items:
        entries.append({
            "id": f"ct_{len(entries):03d}",
            "technique": current_technique,
            "content": "\n".join(current_items),
            "tags": _extract_tags(current_technique + " " + " ".join(current_items)),
            "source": "心理咨询技术库"
        })
    
    return entries


def parse_psych_mechanisms():
    """3心理学理论机制库 — 长文档，按理论/章节分组"""
    doc = Document(KB_DIR / "3心理学理论机制库.docx")
    entries = []
    current_section = ""
    current_content = []
    
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        # 检测章节标题
        if (text.startswith(("一、", "二、", "三、", "四、", "五、", "六、", "七、", "八、", "九、", "十、")) or
            text.startswith(("1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.")) and len(text) < 80 or
            "理论" in text and len(text) < 60):
            if current_section and current_content:
                # 截取前2000字符作为content
                content = "\n".join(current_content)[:2000]
                entries.append({
                    "id": f"pm_{len(entries):03d}",
                    "section": current_section,
                    "content": content,
                    "tags": _extract_tags(current_section + " " + content),
                    "source": "心理机制库"
                })
            current_section = text
            current_content = []
        else:
            current_content.append(text)
    
    if current_section and current_content:
        content = "\n".join(current_content)[:2000]
        entries.append({
            "id": f"pm_{len(entries):03d}",
            "section": current_section,
            "content": content,
            "tags": _extract_tags(current_section + " " + content),
            "source": "心理机制库"
        })
    
    return entries


def parse_cultural_features():
    """4跨文化大学生心理文化特征库 — 3个表格，每行一条"""
    doc = Document(KB_DIR / "4跨文化大学生心理文化特征库300条.docx")
    entries = []
    
    for table in doc.tables:
        for ri, row in enumerate(table.rows):
            if ri == 0:  # 跳过表头
                continue
            cells = [cell.text.strip() for cell in row.cells]
            if len(cells) >= 7 and cells[0]:  # ID列非空
                entry = {
                    "id": cells[0],
                    "culture": cells[1],
                    "dimension": cells[2],
                    "feature": cells[3],
                    "behavior": cells[4],
                    "psych_mechanism": cells[5],
                    "risk": cells[6],
                    "content": f"{cells[3]}\n行为表现：{cells[4]}\n心理机制：{cells[5]}\n风险：{cells[6]}",
                    "tags": _extract_tags(cells[2] + " " + cells[3] + " " + cells[5]),
                    "source": "文化特征库"
                }
                entries.append(entry)
    
    return entries


def parse_event_library():
    """5事件库 — 纯文本，按事件分组"""
    doc = Document(KB_DIR / "5事件库.docx")
    entries = []
    current_event = ""
    current_items = []
    
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        # 检测事件标题（如"1. 期末考试挂科或低于及格线"或"一、..."）
        if text.startswith(("一、", "二、", "三、", "四、", "五、", "六、", "七、", "八、", "九、", "十、")):
            if current_event and current_items:
                entries.append({
                    "id": f"ev_{len(entries):03d}",
                    "event": current_event,
                    "content": "\n".join(current_items),
                    "tags": _extract_tags(current_event + " " + " ".join(current_items)),
                    "source": "事件库"
                })
            current_event = text
            current_items = []
        elif text[0].isdigit() and '.' in text[:5] and len(text) < 80:
            # 子事件标题
            if current_event and current_items:
                entries.append({
                    "id": f"ev_{len(entries):03d}",
                    "event": current_event,
                    "content": "\n".join(current_items),
                    "tags": _extract_tags(current_event + " " + " ".join(current_items)),
                    "source": "事件库"
                })
            current_event = text
            current_items = []
        else:
            current_items.append(text)
    
    if current_event and current_items:
        entries.append({
            "id": f"ev_{len(entries):03d}",
            "event": current_event,
            "content": "\n".join(current_items),
            "tags": _extract_tags(current_event + " " + " ".join(current_items)),
            "source": "事件库"
        })
    
    return entries


def parse_crisis_library():
    """6危机识别库 — 纯文本段落"""
    doc = Document(KB_DIR / "6危机识别库.docx")
    entries = []
    
    for i, para in enumerate(doc.paragraphs):
        text = para.text.strip()
        if text:
            entries.append({
                "id": f"cr_{i:03d}",
                "content": text,
                "tags": _extract_tags(text),
                "source": "危机转介库"
            })
    
    return entries


def _extract_tags(text: str) -> list:
    """简单的关键词提取"""
    keywords = [
        "焦虑", "抑郁", "孤独", "压力", "恐惧", "愤怒", "悲伤", "羞耻", "内疚",
        "学业", "考试", "GPA", "社交", "家庭", "关系", "恋爱", "就业", "经济",
        "中国", "美国", "留学生", "跨文化", "集体主义", "个人主义",
        "CBT", "正念", "冥想", "呼吸", "放松", "运动", "音乐",
        "自杀", "自伤", "危机", "热线", "转介", "安全",
        "积极", "感恩", "意义", "成长", "韧性", "希望",
        "文化", "面子", "期望", "身份", "适应", "语言",
        "睡眠", "饮食", "身体", "躯体化", "疲劳",
        "anxiety", "depression", "loneliness", "stress", "fear", "anger",
        "academic", "social", "family", "relationship", "employment",
        "china", "america", "international", "cross-cultural",
        "CBT", "mindfulness", "meditation", "breathing", "relaxation",
        "suicide", "self-harm", "crisis", "hotline", "safety",
        "positive", "gratitude", "meaning", "growth", "resilience",
    ]
    text_lower = text.lower()
    found = [kw for kw in keywords if kw.lower() in text_lower]
    return list(set(found))[:10]


def parse_all():
    """解析所有知识库"""
    print("正在解析知识库文件...")
    
    parsers = {
        "psych_science": parse_psych_science,
        "counseling_techniques": parse_counseling_techniques,
        "psych_mechanisms": parse_psych_mechanisms,
        "cultural_features": parse_cultural_features,
        "event_library": parse_event_library,
        "crisis_library": parse_crisis_library,
    }
    
    all_kb = {}
    for name, parser in parsers.items():
        try:
            entries = parser()
            all_kb[name] = entries
            out_path = OUTPUT_DIR / f"{name}.json"
            out_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2))
            print(f"  ✓ {name}: {len(entries)} 条")
        except Exception as e:
            print(f"  ✗ {name}: {e}")
            all_kb[name] = []
    
    # 输出汇总
    total = sum(len(v) for v in all_kb.values())
    print(f"\n总计: {total} 条知识条目")
    
    return all_kb


if __name__ == "__main__":
    parse_all()
