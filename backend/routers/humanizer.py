from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import time
import httpx
import random
import re

router = APIRouter()

STRENGTH_PROMPTS = {
    "light": (
        "Lightly rewrite the following AI-generated text to sound slightly more natural and human. "
        "Make small adjustments only. Keep the structure mostly the same. "
        "Avoid robotic phrasing and stiff transitions."
    ),
    "balanced": (
        "Rewrite the following AI-generated text so it sounds like it was written by a real human. "
        "Make it natural, clear, and conversational. "
        "Vary sentence length. Avoid robotic phrasing, overly formal tone, and AI-style transitions."
    ),
    "strong": (
        "Heavily rewrite the following AI-generated text so it sounds completely human-written. "
        "Make it natural, expressive, and engaging. "
        "Use varied sentence structure, natural rhythm, and authentic word choices. "
        "Remove all robotic, generic, or AI-sounding phrasing while keeping the original meaning."
    ),
}


class HumanizeRequest(BaseModel):
    text: str
    strength: str = "balanced"
    user_id: Optional[str] = None


async def call_groq(prompt: str) -> str:
    groq_key = os.getenv("GROQ_API_KEY")

    if not groq_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")

    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {groq_key}"
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.8,
        "max_tokens": 1024,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Groq API error: {response.text}"
        )

    data = response.json()
    return data["choices"][0]["message"]["content"]


def estimate_human_score(original: str, humanized: str, strength: str) -> int:
    """
    Estimate a 'human-like' score based on:
    - how much changed
    - sentence length variation
    - strength chosen
    """
    if not humanized:
        return 0

    original_words = re.findall(r"\w+", original.lower())
    humanized_words = re.findall(r"\w+", humanized.lower())

    if not humanized_words:
        return 0

    common = set(original_words) & set(humanized_words)
    diff_ratio = 1 - (len(common) / max(len(humanized_words), 1))

    sentences = re.split(r"[.!?]+", humanized)
    lengths = [len(s.split()) for s in sentences if s.strip()]
    if len(lengths) > 1:
        avg = sum(lengths) / len(lengths)
        variation = sum(abs(l - avg) for l in lengths) / len(lengths)
    else:
        variation = 0

    base = 85
    base += min(diff_ratio * 10, 8)
    base += min(variation, 4)

    if strength == "strong":
        base += 2
    elif strength == "light":
        base -= 2

    base += random.uniform(-1.5, 1.5)

    return max(80, min(99, int(round(base))))


async def log_tool_usage_to_supabase(
    user_id: str,
    input_text: str,
    output_text: str,
    duration_ms: int,
    strength: str,
    human_score: int
):
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("⚠️ Supabase env missing. Skipping DB log.")
        return

    endpoint = f"{supabase_url}/rest/v1/tool_usage"

    payload = {
        "user_id": user_id,
        "tool_name": "humanizer",
        "input_size": len(input_text),
        "output_size": len(output_text),
        "duration_ms": duration_ms,
        "status": "success",
        "metadata": {
            "strength": strength,
            "human_score": human_score
        }
    }

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(endpoint, json=payload, headers=headers)

    if response.status_code not in [200, 201, 204]:
        print("⚠️ Supabase logging failed:")
        print(response.status_code)
        print(response.text)


@router.post("/humanize")
async def humanize_text(request: HumanizeRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    start_time = time.time()

    try:
        instruction = STRENGTH_PROMPTS.get(request.strength, STRENGTH_PROMPTS["balanced"])

        prompt = f"""{instruction}

Text to humanize:
\"\"\"{request.text}\"\"\"

Return ONLY the rewritten text. Do not include explanations, labels, quotes, markdown, bullets, or any extra formatting.
"""

        humanized_text = await call_groq(prompt)
        humanized_text = humanized_text.strip()

        if not humanized_text:
            raise HTTPException(status_code=500, detail="No result returned from Groq")

        duration_ms = int((time.time() - start_time) * 1000)

        human_score = estimate_human_score(request.text, humanized_text, request.strength)

        if request.user_id:
            try:
                await log_tool_usage_to_supabase(
                    user_id=request.user_id,
                    input_text=request.text,
                    output_text=humanized_text,
                    duration_ms=duration_ms,
                    strength=request.strength,
                    human_score=human_score
                )
            except Exception as db_error:
                print(f"⚠️ DB logging failed: {db_error}")

        return {
            "success": True,
            "result": humanized_text,
            "human_score": human_score,
            "duration_ms": duration_ms
        }

    except HTTPException:
        raise

    except Exception as e:
        error_message = str(e)
        print(f"❌ Humanizer error: {error_message}")

        if "429" in error_message or "rate" in error_message.lower():
            raise HTTPException(
                status_code=429,
                detail="AI rate limit reached. Please wait a minute and try again."
            )

        raise HTTPException(status_code=500, detail="Something went wrong while humanizing.")