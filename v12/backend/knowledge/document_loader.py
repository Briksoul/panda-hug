"""Load and chunk the six curated Panda Hug knowledge libraries."""
from __future__ import annotations

import hashlib
import os
import re
from pathlib import Path


LIBRARY_SPECS = {
    "01_psychology_education": {
        "layer": "psychology_education",
        "label": "心理科普库",
        "agent_roles": ["triage", "counselor", "cultural"],
    },
    "02_counseling_techniques": {
        "layer": "counseling_techniques",
        "label": "心理咨询技术库",
        "agent_roles": ["counselor", "coach", "supervisor"],
    },
    "03_psychological_mechanisms": {
        "layer": "psychological_mechanisms",
        "label": "心理机制库",
        "agent_roles": ["counselor", "cultural", "case_formulation", "insight_report"],
    },
    "04_crisis_referral": {
        "layer": "crisis_referral",
        "label": "危机转介库",
        "agent_roles": ["risk", "crisis", "sensing"],
    },
    "05_cultural_features": {
        "layer": "cultural_features",
        "label": "文化特征库",
        "agent_roles": ["counselor", "cultural", "insight_report"],
    },
    "06_case_events": {
        "layer": "case_events",
        "label": "案例事件库",
        "agent_roles": ["counselor", "cultural", "case_formulation"],
    },
}


def resolve_knowledge_base_dir(source_dir: str | Path | None = None) -> Path | None:
    project_root = Path(__file__).resolve().parents[2]
    candidates = [
        Path(source_dir).expanduser() if source_dir else None,
        Path(os.environ["KNOWLEDGE_BASE_DIR"]).expanduser()
        if os.getenv("KNOWLEDGE_BASE_DIR")
        else None,
        project_root / "knowledge_base",
        project_root.parent / "knowledge_base",
    ]
    for candidate in candidates:
        if candidate and candidate.is_dir():
            return candidate.resolve()
    return None


def load_markdown_knowledge(
    source_dir: str | Path | None = None,
    chunk_size: int = 1200,
    overlap_blocks: int = 1,
) -> dict[str, list[dict]]:
    root = resolve_knowledge_base_dir(source_dir)
    if not root:
        return {}

    layers: dict[str, list[dict]] = {}
    for directory_name, spec in LIBRARY_SPECS.items():
        directory = root / directory_name
        if not directory.is_dir():
            continue

        layer_items = layers.setdefault(spec["layer"], [])
        for path in sorted(directory.glob("*.md")):
            culture_scope = _culture_scope(path.name)
            for index, chunk in enumerate(
                _chunk_markdown(path.read_text(encoding="utf-8"), chunk_size, overlap_blocks)
            ):
                digest = hashlib.sha1(
                    f"{path.relative_to(root)}:{index}".encode("utf-8")
                ).hexdigest()[:12]
                layer_items.append({
                    "id": f"{spec['layer']}_{digest}",
                    "content": chunk,
                    "tags": [
                        spec["label"],
                        path.stem,
                        culture_scope,
                    ],
                    "source": str(path.relative_to(root)),
                    "library": spec["label"],
                    "culture_scope": culture_scope,
                    "agent_roles": list(spec["agent_roles"]),
                })
    return layers


def _culture_scope(filename: str) -> str:
    if filename.startswith("5.1"):
        return "china"
    if filename.startswith("5.2"):
        return "us"
    if filename.startswith("5.3"):
        return "cross_cultural"
    if filename.startswith("6.1"):
        return "china"
    if filename.startswith("6.2"):
        return "abroad"
    return "all"


def _chunk_markdown(
    text: str,
    chunk_size: int,
    overlap_blocks: int,
) -> list[str]:
    raw_blocks = re.split(r"\n\s*\n", text.replace("\r\n", "\n"))
    blocks: list[str] = []
    current_heading = ""

    for raw_block in raw_blocks:
        block = _clean_markdown(raw_block)
        if not block:
            continue
        if _looks_like_heading(raw_block, block):
            current_heading = block
            continue

        if len(block) > chunk_size:
            pieces = _split_long_block(block, chunk_size)
        else:
            pieces = [block]
        for piece in pieces:
            blocks.append(f"{current_heading}\n{piece}".strip())

    chunks: list[str] = []
    current: list[str] = []
    current_length = 0
    for block in blocks:
        added_length = len(block) + (2 if current else 0)
        if current and current_length + added_length > chunk_size:
            chunks.append("\n\n".join(current))
            current = current[-overlap_blocks:] if overlap_blocks else []
            current_length = sum(len(item) for item in current) + max(0, len(current) - 1) * 2
        current.append(block)
        current_length += len(block) + (2 if len(current) > 1 else 0)

    if current:
        chunks.append("\n\n".join(current))
    return chunks


def _clean_markdown(text: str) -> str:
    text = re.sub(r"<img[^>]*>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"^#{1,6}\s*", "", text.strip())
    text = text.replace("**", "").replace("__", "")
    text = re.sub(r"\\([.\-()])", r"\1", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def _looks_like_heading(raw: str, cleaned: str) -> bool:
    stripped = raw.strip()
    return (
        stripped.startswith("#")
        or (
            len(cleaned) <= 80
            and stripped.startswith("**")
            and stripped.endswith("**")
        )
    )


def _split_long_block(block: str, chunk_size: int) -> list[str]:
    lines = block.splitlines()
    if len(lines) > 1:
        pieces: list[str] = []
        current: list[str] = []
        length = 0
        for line in lines:
            if current and length + len(line) + 1 > chunk_size:
                pieces.append("\n".join(current))
                current = []
                length = 0
            current.append(line)
            length += len(line) + 1
        if current:
            pieces.append("\n".join(current))
        return pieces

    return [
        block[start:start + chunk_size]
        for start in range(0, len(block), chunk_size)
    ]
