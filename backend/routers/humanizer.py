from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
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


def get_gemini_model():
    gemini_key = os.getenv("GEMINI_API_KEY")

    if not gemini_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is missing in backend/.env"
        )

    genai.configure(api_key=gemini_key)
    return genai.GenerativeModel("gemini-2.5-flash")


def estimate_human_score(original: str, humanized: str, strength: str) -> int:
    """
    Estimate a 'human-like' score based on:
    - how much changed
    - sentence length variation
    - strength chosen
    """
    if not humanized:
        return 0

    # Difference ratio
    original_words = re.findall(r"\w+", original.lower())
    humanized_words = re.findall(r"\w+", humanized.lower())

    if not humanized_words:
        return 0

    common = set(original_words) & set(humanized_words)
    diff_ratio = 1 - (len(common) / max(len(humanized_words), 1))

    # Sentence length variation
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
        model = get_gemini_model()

        instruction = STRENGTH_PROMPTS.get(request.strength, STRENGTH_PROMPTS["balanced"])

        prompt = f"""{instruction}

Text to humanize:
\"\"\"{request.text}\"\"\"

Return ONLY the rewritten text. Do not include explanations, labels, quotes, markdown, bullets, or any extra formatting.
"""

        response = model.generate_content(prompt)
        humanized_text = response.text.strip()

        if not humanized_text:
            raise HTTPException(status_code=500, detail="No result returned from Gemini")

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

        if "429" in error_message or "quota" in error_message.lower():
            raise HTTPException(
                status_code=429,
                detail="AI quota limit reached. Please wait a minute and try again."
            )

        raise HTTPException(status_code=500, detail="Something went wrong while humanizing.")