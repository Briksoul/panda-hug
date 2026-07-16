"""创建 Hume EVI 配置 — Counselor Agent 语音模式"""
import asyncio
import os
from pathlib import Path

# 加载 .env
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

from hume.client import AsyncHumeClient

HUME_API_KEY = os.getenv("HUME_API_KEY")

COUNSELOR_SYSTEM_PROMPT = """你是 PANDA Harmony 的数字心理咨询师（Counselor Agent），一位温暖、专业的心理健康伙伴。

## 你的角色
- 你是一位跨文化心理咨询师，擅长倾听、共情、探索和澄清
- 你的目标是帮助用户表达情绪、理解自己的感受，并找到应对方法
- 你使用认知行为疗法（CBT）和东方智慧（佛学/儒家）相结合的方式

## 沟通风格
- 温暖、真诚、不评判
- 多用开放式问题引导用户表达
- 适当反映用户的情感（"听起来你感到..."）
- 避免直接给建议，而是引导用户自己发现
- 保持简洁，每次回复不超过3-4句话

## 文化敏感性
- 对中国用户：理解集体主义文化背景，关注家庭关系、面子文化
- 对留学生：理解文化适应压力、孤独感、身份认同困惑
- 对西方用户：关注个人效能、自我实现需求

## 安全守则
- 如果检测到用户有自伤或自杀倾向，立即提供危机资源：
  - 中国：北京心理危机研究与干预中心 010-82951332
  - 全球：国际自杀预防协会 https://www.iasp.info/resources/Crisis_Centres/
- 不要诊断或开药，建议用户寻求专业帮助

## 情绪感知
- 你会收到用户语音的情绪分析数据（prosody scores）
- 根据用户的情绪状态调整你的回应方式：
  - 焦虑/紧张：放慢节奏，引导深呼吸
  - 悲伤/低落：表达共情，避免过度积极
  - 愤怒/烦躁：认可感受，引导理性表达
"""


async def create_evi_config():
    """创建 EVI 配置并返回 config_id"""
    client = AsyncHumeClient(api_key=HUME_API_KEY)

    # 创建 EVI 配置
    config = await client.empathic_voice.configs.create_config(
        name="PANDA Harmony Counselor",
        prompt=COUNSELOR_SYSTEM_PROMPT,
    )

    print(f"✅ EVI Config created!")
    print(f"   Config ID: {config.id}")
    print(f"   Name: {config.name}")
    return config.id


async def list_configs():
    """列出所有 EVI 配置"""
    client = AsyncHumeClient(api_key=HUME_API_KEY)

    print("📋 Existing EVI Configs:")
    async for config in client.empathic_voice.configs.list_configs():
        print(f"   - {config.id}: {config.name}")


if __name__ == "__main__":
    asyncio.run(create_evi_config())
