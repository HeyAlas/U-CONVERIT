from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import os
import time
import httpx
import base64

router = APIRouter()

ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/bmp",
]

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


async def call_groq_ocr(prompt: str, mime_type: str, image_base64: str) -> str:
    groq_key = os.getenv("GROQ_API_KEY")

    if not groq_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing")

    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {groq_key}"
    }

    payload = {
        "model": "llama-3.2-11b-vision-preview",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{image_base64}"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 1024,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Groq API error: {response.text}"
        )

    data = response.json()
    return data["choices"][0]["message"]["content"]


async def log_tool_usage_to_supabase(
    user_id: str,
    file_name: str,
    file_type: str,
    file_size: int,
    output_text: str,
    duration_ms: int
):
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("⚠️ Supabase env missing. Skipping DB log.")
        return

    endpoint = f"{supabase_url}/rest/v1/tool_usage"

    payload = {
        "user_id": user_id,
        "tool_name": "ocr",
        "input_size": file_size,
        "output_size": len(output_text),
        "duration_ms": duration_ms,
        "status": "success",
        "metadata": {
            "file_name": file_name,
            "file_type": file_type
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
        print(f"⚠️ Supabase logging failed: {response.status_code}")
        print(response.text)


@router.post("/ocr")
async def extract_text(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)
):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Please upload PNG, JPG, or WEBP."
        )

    # Read file
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # Validate file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB."
        )

    start_time = time.time()

    try:
        # Convert image to base64 for Groq
        image_base64 = base64.b64encode(file_bytes).decode("utf-8")

        prompt = """Extract ALL text from this image exactly as it appears.

Rules:
- Preserve the original formatting, line breaks, and structure as much as possible.
- Include all visible text: headings, paragraphs, labels, captions, numbers, etc.
- Do not add explanations, summaries, or comments.
- Do not translate the text.
- If no text is found, respond with: "No text found in image."
- Return ONLY the extracted text."""

        # Call Groq Vision
        extracted_text = await call_groq_ocr(prompt, file.content_type, image_base64)
        extracted_text = extracted_text.strip()

        if not extracted_text:
            extracted_text = "No text found in image."

        duration_ms = int((time.time() - start_time) * 1000)

        # Log to Supabase
        if user_id:
            try:
                await log_tool_usage_to_supabase(
                    user_id=user_id,
                    file_name=file.filename or "unknown",
                    file_type=file.content_type,
                    file_size=file_size,
                    output_text=extracted_text,
                    duration_ms=duration_ms
                )
            except Exception as db_error:
                print(f"⚠️ DB logging failed: {db_error}")

        return {
            "success": True,
            "text": extracted_text,
            "duration_ms": duration_ms
        }

    except HTTPException:
        raise

    except Exception as e:
        error_message = str(e)
        print(f"❌ OCR error: {error_message}")

        if "429" in error_message or "rate" in error_message.lower():
            raise HTTPException(
                status_code=429,
                detail="AI rate limit reached. Please wait a minute and try again."
            )

        raise HTTPException(
            status_code=500,
            detail="Something went wrong while extracting text."
        )