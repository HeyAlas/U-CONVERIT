from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
import os
import time
import json
import re
import httpx
import google.generativeai as genai

router = APIRouter()

GEMINI_MODEL_NAME = "gemini-2.0-flash-lite"

MODE_PROMPT = (
    "You are an expert quiz writer.\n"
    "Create multiple-choice questions from the study material provided by the user.\n"
    "Return ONLY JSON. No explanations.\n"
)

# ── REQUEST MODELS ──
class QuizGenerateRequest(BaseModel):
    content: str
    count: int = 5
    user_id: Optional[str] = None
    title: Optional[str] = None
    difficulty: Optional[str] = "medium"


class QuizAttemptRequest(BaseModel):
    quiz_id: str
    user_id: str
    score: int
    total: int
    answers: List[Any]
    duration_seconds: int


# ── HELPERS ──
def extract_json_array(text: str) -> Any:
    m = re.search(r"\[.*\]", text, re.DOTALL)
    if not m:
        raise ValueError("Could not find a JSON array in the AI response.")
    return json.loads(m.group(0))


def get_gemini_model():
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is missing in backend/.env")

    genai.configure(api_key=gemini_key)
    return genai.GenerativeModel("gemini-2.5-flash")


def get_supabase_headers():
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    return {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def save_quiz_to_supabase(
    user_id: str,
    title: str,
    source_text: str,
    questions: list,
    difficulty: str,
):
    """Saves the generated quiz to the quizzes table and returns the quiz ID."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("⚠️ Supabase env missing. Skipping quiz save.")
        return None

    endpoint = f"{supabase_url}/rest/v1/quizzes"

    payload = {
        "user_id": user_id,
        "title": title or f"Quiz - {time.strftime('%b %d, %Y')}",
        "source_text": source_text[:5000],  # Cap at 5000 chars to save space
        "questions": questions,
        "total_questions": len(questions),
        "difficulty": difficulty,
    }

    async with httpx.AsyncClient() as client:
        r = await client.post(endpoint, json=payload, headers=get_supabase_headers())

    if r.status_code in (200, 201):
        result = r.json()
        if isinstance(result, list) and len(result) > 0:
            return result[0].get("id")
    
    print(f"⚠️ Failed to save quiz: {r.status_code} - {r.text}")
    return None


async def log_tool_usage_to_supabase(
    user_id: str,
    input_size: int,
    output_size: int,
    duration_ms: int,
    count: int
):
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        return

    endpoint = f"{supabase_url}/rest/v1/tool_usage"
    payload = {
        "user_id": user_id,
        "tool_name": "quiz_maker",
        "input_size": input_size,
        "output_size": output_size,
        "duration_ms": duration_ms,
        "status": "success",
        "metadata": {"count": count},
    }

    headers = get_supabase_headers()
    headers["Prefer"] = "return=minimal"

    async with httpx.AsyncClient() as client:
        await client.post(endpoint, json=payload, headers=headers)


# ── ENDPOINTS ──
@router.post("/quiz/generate")
async def generate_quiz(req: QuizGenerateRequest):
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    if req.count < 1 or req.count > 20:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 20")

    start = time.time()

    try:
        model = get_gemini_model()

        prompt = (
            f"{MODE_PROMPT}\n"
            f"Study material:\n{req.content}\n\n"
            f"Generate exactly {req.count} quiz questions.\n"
            f"Each question must follow this JSON format:\n"
            f"{{\"question\": string, \"choices\": [4 strings], \"correctIndex\": integer 0-3}}\n\n"
            f"Rules:\n"
            f"- One correct answer per question.\n"
            f"- The other choices must be plausible distractors from the text.\n"
            f"- Do NOT invent facts not present in the material.\n"
            f"- Return ONLY a JSON array of length {req.count}.\n"
            f"- No markdown, no extra text.\n"
        )

        resp = model.generate_content(prompt)
        raw = (resp.text or "").strip()

        data = extract_json_array(raw)

        if not isinstance(data, list) or len(data) != req.count:
            raise ValueError("AI did not return the expected number of questions.")

        for item in data:
            if not isinstance(item, dict):
                raise ValueError("Invalid question format.")
            if not isinstance(item.get("choices"), list) or len(item["choices"]) != 4:
                raise ValueError("Each question must have exactly 4 choices.")
            if item.get("correctIndex") not in (0, 1, 2, 3):
                raise ValueError("correctIndex must be 0..3.")

        duration_ms = int((time.time() - start) * 1000)

        # Save quiz to database
        quiz_id = None
        if req.user_id:
            try:
                quiz_id = await save_quiz_to_supabase(
                    user_id=req.user_id,
                    title=req.title,
                    source_text=req.content,
                    questions=data,
                    difficulty=req.difficulty or "medium",
                )

                await log_tool_usage_to_supabase(
                    user_id=req.user_id,
                    input_size=len(req.content),
                    output_size=len(raw),
                    duration_ms=duration_ms,
                    count=req.count
                )
            except Exception as db_error:
                print(f"⚠️ DB save failed: {db_error}")

        return {
            "success": True, 
            "questions": data,
            "quiz_id": quiz_id,
        }

    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        msg = str(e).lower()
        if "429" in str(e) or "quota" in msg:
            raise HTTPException(
                status_code=429,
                detail="AI quota limit reached. Please wait a minute and try again."
            )
        raise HTTPException(status_code=500, detail="Failed to generate quiz.")


@router.post("/quiz/attempt")
async def save_quiz_attempt(req: QuizAttemptRequest):
    """Saves a completed quiz attempt to the quiz_attempts table."""
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    percentage = round((req.score / req.total) * 100, 2) if req.total > 0 else 0

    from datetime import datetime, timezone

    payload = {
        "quiz_id": req.quiz_id,
        "user_id": req.user_id,
        "score": req.score,
        "total": req.total,
        "answers": req.answers,
        "duration_seconds": req.duration_seconds,
        "completed_at": datetime.now(timezone.utc).isoformat(),   # ← ADD THIS LINE
    }

    endpoint = f"{supabase_url}/rest/v1/quiz_attempts"

    async with httpx.AsyncClient() as client:
        r = await client.post(endpoint, json=payload, headers=get_supabase_headers())

    if r.status_code not in (200, 201):
        print(f"❌ Failed to save attempt:")
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
        print(f"Payload sent: {payload}")
        raise HTTPException(
            status_code=r.status_code,
            detail=f"Failed to save quiz attempt ({r.text})"
        )

    return {"success": True, "percentage": percentage}