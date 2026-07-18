"""测试 Hume EVI 连接 — 网络恢复后运行"""
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


async def test_connection():
    """测试 Hume API 连接 + 创建 EVI Config"""
    api_key = os.getenv("HUME_API_KEY", "")
    if not api_key:
        print("❌ HUME_API_KEY not set")
        return

    print(f"🔑 API Key: {api_key[:8]}...{api_key[-4:]}")
    client = AsyncHumeClient(api_key=api_key)

    # 1. 测试连接 — 列出现有配置
    print("\n📋 Listing existing EVI configs...")
    try:
        configs = await client.empathic_voice.configs.list_configs()
        if hasattr(configs, "items"):
            items = configs.items
        else:
            items = configs
        print(f"   Found {len(items)} configs")
        for c in items[:5]:
            print(f"   - {c.id}: {c.name}")
    except Exception as e:
        print(f"❌ Failed to list configs: {e}")
        return

    # 2. 创建 PANDA Harmony Counselor 配置
    print("\n🤖 Creating PANDA Harmony Counselor config...")
    counselor_prompt = """你是 PANDA Harmony 的数字心理咨询师，一位温暖、专业的心理健康伙伴。

## 角色
- 跨文化心理咨询师，擅长倾听、共情、探索和澄清
- 使用 CBT 和东方智慧（佛学/儒家）相结合

## 沟通风格
- 温暖、真诚、不评判
- 多用开放式问题引导表达
- 每次回复不超过3句话

## 安全
- 检测到自伤倾向时提供危机资源"""

    try:
        config = await client.empathic_voice.configs.create_config(
            name="PANDA Harmony Counselor",
            prompt=counselor_prompt,
            evi_version="3",
        )
        print(f"✅ Config created!")
        print(f"   ID: {config.id}")
        print(f"   Name: {config.name}")

        # 保存到 .env
        env_content = _env_path.read_text()
        if "HUME_CONFIG_ID=" in env_content:
            env_content = env_content.replace(
                "HUME_CONFIG_ID=",
                f"HUME_CONFIG_ID={config.id}"
            )
        else:
            env_content += f"\nHUME_CONFIG_ID={config.id}\n"
        _env_path.write_text(env_content)
        print(f"   Saved to .env ✅")

    except Exception as e:
        print(f"❌ Failed to create config: {e}")
        return

    # 3. 测试 WebSocket 连接（不发送音频，只验证连接）
    print("\n🔌 Testing WebSocket connection...")
    try:
        async with client.empathic_voice.chat.connect(
            config_id=config.id
        ) as socket:
            print("   WebSocket connected ✅")
            # 发送一条文本消息测试
            await socket.send_text("你好")
            print("   Sent test message")

            # 等待响应
            async for message in socket:
                if hasattr(message, "type"):
                    print(f"   Received: {message.type}")
                    if message.type in ("assistant_message", "error"):
                        break
                if hasattr(message, "message") and hasattr(message.message, "content"):
                    print(f"   Response: {message.message.content}")
                    break
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")

    print("\n✅ Test complete!")


if __name__ == "__main__":
    asyncio.run(test_connection())
