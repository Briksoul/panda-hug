"""Convert the supplied clinician DOCX directory into structured JSON."""
from __future__ import annotations

import json
import re
import sys
import uuid
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


BACKEND_DIR = Path(__file__).resolve().parent.parent
REPOSITORY_DIR = BACKEND_DIR.parent
DEFAULT_SOURCE = (
    REPOSITORY_DIR
    / "knowledge_base"
    / "08_medical_resources"
    / "心理咨询医生知识库.docx"
)
DEFAULT_OUTPUT = BACKEND_DIR / "resources" / "medical_resources.json"

US_STATES = {
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York",
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
    "West Virginia", "Wisconsin", "Wyoming",
}
CHINA_REGIONS = {
    "北京市", "天津市", "河北省", "山西省", "内蒙古自治区", "辽宁省",
    "吉林省", "黑龙江省", "上海市", "江苏省", "浙江省", "安徽省",
    "福建省", "江西省", "山东省", "河南省", "湖北省", "湖南省",
    "广东省", "广西壮族自治区", "海南省", "重庆市", "四川省",
    "贵州省", "云南省", "西藏自治区", "陕西省", "甘肃省", "青海省",
    "宁夏回族自治区", "新疆维吾尔自治区", "台湾省",
    "香港特别行政区", "澳门特别行政区",
}


def extract_paragraphs(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    paragraphs = []
    for paragraph in document.iter():
        if not paragraph.tag.endswith("}p"):
            continue
        pieces = []
        for node in paragraph.iter():
            if node.tag.endswith("}t") and node.text:
                pieces.append(node.text)
            elif node.tag.endswith("}br"):
                pieces.append("\n")
            elif node.tag.endswith("}tab"):
                pieces.append("\t")
        text = "".join(pieces).strip()
        if text:
            paragraphs.extend(
                cleaned
                for part in text.splitlines()
                if (cleaned := clean_text(part))
            )
    return paragraphs


def clean_text(value: str) -> str:
    value = value.replace("\u2028", "\n").replace("\xa0", " ")
    value = re.sub(r"^[\s•]+", "", value)
    return re.sub(r"\s+", " ", value).strip()


def first_match(pattern: str, text: str) -> str:
    match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
    return clean_text(match.group(1)) if match else ""


def parse_contact(text: str, label: str) -> list[str]:
    values = []
    for line in text.splitlines():
        match = re.search(
            rf"(?:^|\s)(?:Business\s+)?(?:{label})\s*[:：]\s*(.+)$",
            line,
            re.IGNORECASE,
        )
        if match and (cleaned := clean_text(match.group(1))):
            values.append(cleaned)
    return values


def parse_specialties(text: str) -> list[str]:
    match = re.search(
        r"(?:擅长领域|专业擅长)\s*（?Specialties）?\s*[:：]\s*(.*?)(?:照片|$)",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return []
    value = match.group(1)
    parts = re.split(r"[•\n]+", value)
    return [
        cleaned
        for part in parts
        if (cleaned := clean_text(part)) and cleaned not in {"—", "-"}
    ]


def clinician_record(
    text: str,
    country: str,
    region: str,
    region_zh: str,
    source_url: str,
) -> dict:
    name = first_match(
        r"姓名\s*（Name）\s*[:：]\s*(.*?)(?=\s+联系方式|$)",
        text,
    )
    organization = first_match(
        r"单位\s*（Organization）\s*[:：]\s*(.*?)(?=\s+(?:擅长领域|专业擅长|照片)|$)",
        text,
    )
    return {
        "id": str(uuid.uuid5(
            uuid.NAMESPACE_URL,
            f"{country}|{region}|{name}|{organization}",
        )),
        "resource_type": "clinician",
        "country": country,
        "region": region,
        "region_zh": region_zh,
        "name": name,
        "organization": organization,
        "phones": parse_contact(text, r"Phone|预约电话|市话"),
        "emails": parse_contact(text, "Email"),
        "websites": parse_contact(text, "Website"),
        "other_contacts": (
            parse_contact(text, r"WeChat|微信号")
            + parse_contact(text, "QQ")
            + parse_contact(text, "WhatsApp")
        ),
        "address": first_match(
            r"工作地点\s*（Location）\s*[:：]\s*(.*?)(?=\s+(?:门诊时间|单位)|$)",
            text,
        ),
        "schedule": first_match(
            r"门诊时间\s*（Schedule）\s*[:：]\s*(.*?)(?=\s+单位|$)",
            text,
        ),
        "specialties": parse_specialties(text),
        "source_url": source_url,
        "verification_status": "unverified_source_document",
    }


def parse_resources(lines: list[str]) -> list[dict]:
    resources = []
    country = ""
    region = ""
    region_zh = ""
    source_url = ""
    current = []

    def flush() -> None:
        nonlocal current
        if not current or not country or not region:
            current = []
            return
        text = "\n".join(current)
        if "姓名（Name）" in text:
            record = clinician_record(
                text,
                country,
                region,
                region_zh,
                source_url,
            )
            if record["name"]:
                resources.append(record)
        current = []

    for line in lines:
        if line == "美国心理咨询医生知识库":
            flush()
            country = "US"
            region = region_zh = source_url = ""
            continue
        if line == "中国心理咨询医生知识库":
            flush()
            country = "CN"
            region = region_zh = source_url = ""
            continue

        canada = re.fullmatch(r"地点\s*[:：]\s*(.+)", line)
        if canada:
            flush()
            country = "CA"
            region = region_zh = clean_text(canada.group(1))
            source_url = ""
            continue

        us_region = re.search(
            r"([A-Z][A-Za-z ]+)\s*\(([\u4e00-\u9fff]+)\)\s*$",
            line,
        )
        if us_region and us_region.group(1).strip() in US_STATES:
            flush()
            region = us_region.group(1).strip()
            region_zh = us_region.group(2).strip()
            source_url = ""
            continue

        candidate_region = re.sub(
            r"^[一二三四五六七八九十百零〇\d、.\s]+",
            "",
            line,
        )
        if country == "CN" and candidate_region in CHINA_REGIONS:
            flush()
            region = region_zh = candidate_region
            source_url = ""
            continue

        url_match = re.search(r"https?://\S+", line)
        if url_match and not current:
            source_url = url_match.group(0)
            continue

        if "姓名（Name）" in line:
            flush()
            current = [line]
        elif current:
            current.append(line)
        elif country == "CN" and not region and "热线" in line and "：" in line:
            name, detail = line.split("：", 1)
            resources.append({
                "id": str(uuid.uuid5(
                    uuid.NAMESPACE_URL,
                    f"CN|hotline|{name}|{detail}",
                )),
                "resource_type": "hotline",
                "country": "CN",
                "region": "",
                "region_zh": "",
                "name": clean_text(name),
                "organization": "",
                "phones": re.findall(
                    r"(?:\+?86[-\s]?)?(?:\d{3,4}[-－]\d{6,8}|"
                    r"\d{3,4}-\d{3,4}-\d{3,4}|\d{5})",
                    detail,
                ),
                "emails": [],
                "websites": [],
                "other_contacts": [],
                "address": "",
                "schedule": first_match(r"[（(](.*?)[）)]", detail),
                "specialties": ["心理援助热线", "Psychological support hotline"],
                "source_url": "",
                "verification_status": "unverified_source_document",
            })
    flush()
    return resources


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT
    resources = parse_resources(extract_paragraphs(source))
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps({
            "source": str(source.relative_to(REPOSITORY_DIR)),
            "disclaimer_zh": (
                "资源信息来自用户提供的资料，尚未逐条核验。请在联系前自行确认资质、"
                "服务范围、费用与可用性；紧急情况请联系当地急救或危机热线。"
            ),
            "disclaimer_en": (
                "These resources came from a user-provided directory and have "
                "not been individually verified. Confirm credentials, scope, "
                "fees, and availability before use. Contact local emergency or "
                "crisis services for urgent situations."
            ),
            "resources": resources,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    counts = {}
    for resource in resources:
        key = resource["resource_type"]
        counts[key] = counts.get(key, 0) + 1
    print(json.dumps({
        "output": str(output),
        "total": len(resources),
        "counts": counts,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
