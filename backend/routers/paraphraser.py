from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import time
import httpx

router = APIRouter()

MODE_PROMPTS = {
    "standard": "Paraphrase the following text while keeping the same meaning. Provide a balanced rewrite.",
    "fluency": "Paraphrase the following text to improve flow and readability. Make it sound natural.",
    "formal": "Paraphrase the following text in a formal, professional tone suitable for business or academic use.",
    "creative": "Paraphrase the following text in a creative and expressive way. Use vivid language.",
    "shorten": "Paraphrase the following text to be more concise while keeping the core meaning.",
}

class ParaphraseRequest(BaseModel):
    text: str
    mode: str = "standard"
    user_id: Optional[str] = None


async def call_gemini(prompt: str) -> str:
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if not gemini_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is missing")

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": gemini_key
    }
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024,
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload, headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=500, 
            detail=f"Gemini API error: {response.text}"
        )
    
    data = response.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


async def log_tool_usage_to_supabase(
    user_id: str,
    input_text: str,
    output_text: str,
    duration_ms: int,
    mode: str
):
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("⚠️ Supabase URL or service key missing. Skipping DB logging.")
        return

    endpoint = f"{supabase_url}/rest/v1/tool_usage"

    payload = {
        "user_id": user_id,
        "tool_name": "paraphraser",
        "input_size": len(input_text),
        "output_size": len(output_text),
        "duration_ms": duration_ms,
        "status": "success",
        "metadata": {
            "mode": mode
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


@router.post("/paraphrase")
async def paraphrase_text(request: ParaphraseRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    start_time = time.time()

    try:
        instruction = MODE_PROMPTS.get(request.mode, MODE_PROMPTS["standard"])

        prompt = f"""{instruction}

Text to paraphrase:
"{request.text}"

Return ONLY the paraphrased text. Do not include explanations, quotes, markdown, bullets, or extra formatting.
"""
        paraphrased_text = await call_gemini(prompt)

        if not paraphrased_text:
            raise HTTPException(status_code=500, detail="No result returned from Gemini")

        duration_ms = int((time.time() - start_time) * 1000)

        if request.user_id:
            try:
                await log_tool_usage_to_supabase(
                    user_id=request.user_id,
                    input_text=request.text,
                    output_text=paraphrased_text,
                    duration_ms=duration_ms,
                    mode=request.mode
                )
            except Exception as db_error:
                print(f"⚠️ DB logging failed but paraphrase succeeded: {db_error}")

        return {
            "success": True,
            "result": paraphrased_text,
            "duration_ms": duration_ms
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"❌ Paraphraser error: {e}")
        raise HTTPException(status_code=500, detail=str(e))