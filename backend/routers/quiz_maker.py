from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
import os
import time
import json
import re
import httpx

router = APIRouter()

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
import os
import time
import json
import re
import httpx

router = APIRouter()

# ── DIFFICULTY CONFIG ──
DIFFICULTY_CONFIG = {
    "easy": {
        "bloom_level": "Remember and Understand",
        "instruction": (
            "Focus on: definitions, key terms, basic facts, and direct concepts from the material.\n"
            "Questions should be straightforward but NOT copy sentences directly.\n"
            "Rephrase ideas in your own words.\n"
            "Distractors should be clearly wrong but plausible to a beginner."
        ),
        "example_stems": [
            "What is the definition of...",
            "Which of the following best describes...",
            "What does [term] mean in this context...",
        ],
    },
    "medium": {
        "bloom_level": "Apply and Analyze",
        "instruction": (
            "Focus on: relationships between concepts, cause-and-effect, comparisons, "
            "and applications of ideas from the material.\n"
            "Do NOT copy sentences. Rephrase and reframe concepts.\n"
            "Distractors should be plausible — someone who skimmed the material might pick them.\n"
            "Avoid trivial factual recall."
        ),
        "example_stems": [
            "Why does...",
            "What would happen if...",
            "How does [A] relate to [B]...",
            "Which best explains the reason for...",
        ],
    },
    "hard": {
        "bloom_level": "Evaluate and Synthesize",
        "instruction": (
            "Focus on: critical evaluation, synthesis across multiple concepts, edge cases, "
            "implications, and nuanced understanding.\n"
            "Questions must require deep thinking — not surface recall.\n"
            "Distractors must be sophisticated: partially correct, or correct in a different context.\n"
            "Never copy text from the material. Always reframe at a higher abstraction level."
        ),
        "example_stems": [
            "Which conclusion is best supported by...",
            "What is the most significant implication of...",
            "If [condition], which outcome is most likely...",
            "Which of the following best critiques...",
        ],
    },
}

GROQ_MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "gemma2-9b-it",
]

# ── REQUEST MODELS ──
class QuizGenerateRequest(BaseModel):
    content: str
    count: int = 5
    user_id: Optional[str] = None
    title: Optional[str] = None
    difficulty: Optional[str] = "medium"  # "easy" | "medium" | "hard"

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


async def call_groq_once(prompt: str, model: str, groq_key: str) -> str:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {groq_key}"
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 4096,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    if response.status_code == 429:
        raise HTTPException(status_code=429, detail="rate_limited")
    raise HTTPException(status_code=500, detail=f"Groq API error: {response.text}")


async def call_groq(prompt: str) -> str:
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")

    for model in GROQ_MODELS:
        try:
            return await call_groq_once(prompt, model, groq_key)
        except HTTPException as e:
            if e.detail == "rate_limited":
                print(f"⚠️ Model {model} rate limited, trying next...")
                continue
            raise

    raise HTTPException(status_code=429, detail="All Groq models are rate limited. Try again later.")


def build_prompt(
    content: str,
    count: int,
    difficulty: str = "medium",
    previous_questions: list = None   # ← STEP 3
) -> str:
    diff_key = difficulty if difficulty in DIFFICULTY_CONFIG else "medium"
    cfg = DIFFICULTY_CONFIG[diff_key]

    # ── STEP 4 — build memory block ──
    memory_block = ""
    if previous_questions:
        memory_block = (
            f"\nPreviously generated questions "
            f"(DO NOT REPEAT OR REPHRASE THESE):\n"
            f"{json.dumps([q['question'] for q in previous_questions], indent=2)}\n\n"
            f"Rules for avoiding repetition:\n"
            f"- Do not repeat or rephrase any previous question.\n"
            f"- Each question must test a completely new concept "
            f"not already covered above.\n"
            f"- If the material is limited, approach the same concept "
            f"from a different angle or cognitive level.\n\n"
        )

    return (
        # ── ROLE ──
        "You are a university-level assessment designer specializing in "
        "educational testing and cognitive recall.\n"
        "You apply Bloom's Taxonomy to craft questions that test genuine understanding.\n\n"

        # ── TASK ──
        f"Your task: Generate exactly {count} multiple-choice questions "
        f"from the study material below.\n\n"

        # ── DIFFICULTY ──
        f"Difficulty level: {diff_key.upper()}\n"
        f"Cognitive level (Bloom's Taxonomy): {cfg['bloom_level']}\n\n"
        f"Difficulty-specific instructions:\n{cfg['instruction']}\n\n"

        # ── MEMORY BLOCK (injected here) ──
        f"{memory_block}"

        # ── COGNITIVE CONSTRAINTS ──
        "Cognitive quality rules (apply to ALL difficulties):\n"
        "1. Questions must test UNDERSTANDING, not word-matching or copying.\n"
        "2. Do NOT lift sentences directly from the material — reframe all ideas.\n"
        "3. Prioritize: concepts, relationships, causes, definitions in context, "
        "and real-world applications.\n"
        "4. Every distractor (wrong answer) must be plausible — not obviously absurd.\n"
        "5. Only ONE answer must be unambiguously correct.\n"
        "6. Avoid trick questions, double negatives, or 'all of the above'.\n\n"

        # ── MATERIAL ──
        f"Study material:\n{content}\n\n"

        # ── OUTPUT FORMAT ──
        f"Return ONLY a JSON array of exactly {count} objects.\n"
        f"Each object must follow this exact schema:\n"
        f'{{"question": string, "choices": [string, string, string, string], '
        f'"correctIndex": integer 0-3}}\n\n'

        # ── HARD RULES ──
        "Output rules:\n"
        "- Return ONLY valid JSON. No markdown. No explanation. No code fences.\n"
        f"- Array length must be exactly {count}.\n"
        "- correctIndex must be 0, 1, 2, or 3.\n"
        "- All 4 choices must be distinct strings.\n"
    )

async def generate_questions_in_batches(
    content: str,
    total: int,
    difficulty: str = "medium"
) -> list:
    BATCH_SIZE = 5
    all_questions = []
    previous_questions = []  # ← STEP 1: memory variable

    batches = []
    remaining = total
    while remaining > 0:
        batch = min(BATCH_SIZE, remaining)
        batches.append(batch)
        remaining -= batch

    for i, batch_count in enumerate(batches):
        print(f"🔄 Generating batch {i+1}/{len(batches)} "
              f"({batch_count} questions, difficulty={difficulty})...")

        # ← STEP 2: pass previous_questions into prompt
        prompt = build_prompt(
            content,
            batch_count,
            difficulty,
            previous_questions
        )

        raw = await call_groq(prompt)
        raw = raw.strip()
        data = extract_json_array(raw)

        if not isinstance(data, list):
            raise ValueError(f"Batch {i+1} returned invalid format.")

        valid = []
        for item in data:
            if (
                isinstance(item, dict)
                and isinstance(item.get("question"), str)
                and len(item["question"].strip()) > 0
                and isinstance(item.get("choices"), list)
                and len(item["choices"]) == 4
                and all(
                    isinstance(c, str) and len(c.strip()) > 0
                    for c in item["choices"]
                )
                and len(set(item["choices"])) == 4
                and item.get("correctIndex") in (0, 1, 2, 3)
            ):
                item["difficulty"] = difficulty
                valid.append(item)

        all_questions.extend(valid)
        previous_questions.extend(valid)  # ← STEP 5: update memory

        print(f"✅ Batch {i+1} done: {len(valid)} valid questions "
              f"(running total: {len(all_questions)})")

    return all_questions


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
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("⚠️ Supabase env missing. Skipping quiz save.")
        return None

    endpoint = f"{supabase_url}/rest/v1/quizzes"

    payload = {
        "user_id": user_id,
        "title": title or f"Quiz - {time.strftime('%b %d, %Y')}",
        "source_text": source_text[:5000],
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
        raise HTTPException(
            status_code=400,
            detail="Count must be between 1 and 20"
        )

    # Validate difficulty
    difficulty = req.difficulty or "medium"
    if difficulty not in DIFFICULTY_CONFIG:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid difficulty. Choose from: {list(DIFFICULTY_CONFIG.keys())}"
        )

    start = time.time()

    try:
        data = await generate_questions_in_batches(
            req.content,
            req.count,
            difficulty  # ← pass difficulty
        )

        if len(data) == 0:
            raise ValueError("No valid questions were generated.")

        min_acceptable = max(1, int(req.count * 0.8))
        if len(data) < min_acceptable:
            raise ValueError(
                f"Only got {len(data)}/{req.count} valid questions. "
                "Please try again."
            )

        duration_ms = int((time.time() - start) * 1000)

        quiz_id = None
        if req.user_id:
            try:
                quiz_id = await save_quiz_to_supabase(
                    user_id=req.user_id,
                    title=req.title,
                    source_text=req.content,
                    questions=data,
                    difficulty=difficulty,
                )
                await log_tool_usage_to_supabase(
                    user_id=req.user_id,
                    input_size=len(req.content),
                    output_size=len(json.dumps(data)),
                    duration_ms=duration_ms,
                    count=len(data),
                )
            except Exception as db_error:
                print(f"⚠️ DB save failed: {db_error}")

        return {
            "success": True,
            "questions": data,
            "quiz_id": quiz_id,
            "difficulty": difficulty,  # ← return it so frontend can use it
        }

    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e).lower()
        if "429" in str(e) or "rate" in msg:
            raise HTTPException(
                status_code=429,
                detail="AI rate limit reached. Please wait a minute and try again.",
            )
        raise HTTPException(status_code=500, detail="Failed to generate quiz.")

@router.post("/quiz/attempt")
async def save_quiz_attempt(req: QuizAttemptRequest):
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
        "completed_at": datetime.now(timezone.utc).isoformat(),
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


# ── ✅ QUIZ HISTORY ──
@router.get("/quiz/history")
async def get_quiz_history(user_id: str):
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = get_supabase_headers()
    headers["Prefer"] = "return=representation"

    try:
        async with httpx.AsyncClient() as client:

            attempts_res = await client.get(
                f"{supabase_url}/rest/v1/quiz_attempts",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "order": "completed_at.desc"
                }
            )

            if attempts_res.status_code != 200:
                raise Exception("Failed to fetch attempts")

            attempts = attempts_res.json()

            if not attempts:
                return {"success": True, "history": []}

            quiz_ids = list(set([a["quiz_id"] for a in attempts]))

            quizzes_res = await client.get(
                f"{supabase_url}/rest/v1/quizzes",
                headers=headers,
                params={
                    "id": f"in.({','.join(quiz_ids)})"
                }
            )

            quizzes = quizzes_res.json() if quizzes_res.status_code == 200 else []

            quiz_map = {q["id"]: q.get("title", "Untitled Quiz") for q in quizzes}

            history = []
            for a in attempts:
                history.append({
                    "id": a["id"],
                    "topic": quiz_map.get(a["quiz_id"], "Unknown Quiz"),
                    "score": f"{a['score']}/{a['total']}",
                    "date": a["completed_at"]
                })

            return {
                "success": True,
                "history": history
            }

    except Exception as e:
        print(f"❌ Quiz history error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch quiz history")