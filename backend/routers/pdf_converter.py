from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import Optional
import httpx
import time
import os
import io
import tempfile
import shutil
import subprocess

from pdf2docx import Converter
import pdfplumber

router = APIRouter()

# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────

ALLOWED_PDF = ["application/pdf"]
ALLOWED_WORD = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword"
]

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


# ─────────────────────────────────────────────
# SUPABASE LOGGING
# ─────────────────────────────────────────────

async def log_tool_usage_to_supabase(
    user_id: str,
    file_name: str,
    file_type: str,
    file_size: int,
    output_size: int,
    duration_ms: int,
    tool_name: str
):
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("⚠️ Supabase env missing. Skipping DB log.")
        return

    endpoint = f"{supabase_url}/rest/v1/tool_usage"

    payload = {
        "user_id": user_id,
        "tool_name": tool_name,
        "input_size": file_size,
        "output_size": output_size,
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


async def log_file_to_supabase(
    user_id: str,
    file_name: str,
    file_size: int,
    file_type: str,
    tool_used: str
):
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("⚠️ Supabase env missing. Skipping file log.")
        return

    endpoint = f"{supabase_url}/rest/v1/files"

    payload = {
        "user_id": user_id,
        "file_name": file_name,
        "file_size": file_size,
        "file_type": file_type,
        "storage_type": "local",
        "tool_used": tool_used,
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
        print(f"⚠️ Supabase file logging failed: {response.status_code}")
        print(response.text)


# ─────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────

def validate_file(file_bytes: bytes, content_type: str, allowed: list):
    if content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}."
        )
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB."
        )


# ─────────────────────────────────────────────
# 1️⃣ PDF → WORD
# ─────────────────────────────────────────────

@router.post("/pdf-to-word")
async def pdf_to_word(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)
):
    file_bytes = await file.read()
    validate_file(file_bytes, file.content_type, ALLOWED_PDF)

    start_time = time.time()
    tmp_dir = tempfile.mkdtemp()

    try:
        pdf_path  = os.path.join(tmp_dir, "input.pdf")
        docx_path = os.path.join(tmp_dir, "output.docx")

        with open(pdf_path, "wb") as f:
            f.write(file_bytes)

        cv = Converter(pdf_path)
        cv.convert(docx_path, start=0, end=None)
        cv.close()

        with open(docx_path, "rb") as f:
            docx_bytes = f.read()

        duration_ms = int((time.time() - start_time) * 1000)
        output_filename = (file.filename or "document").replace(".pdf", ".docx")

        if user_id:
            try:
                await log_tool_usage_to_supabase(
                    user_id=user_id,
                    file_name=file.filename or "unknown",
                    file_type=file.content_type,
                    file_size=len(file_bytes),
                    output_size=len(docx_bytes),
                    duration_ms=duration_ms,
                    tool_name="pdf-to-word"
                )
                await log_file_to_supabase(
                    user_id=user_id,
                    file_name=output_filename,
                    file_size=len(docx_bytes),
                    file_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    tool_used="pdf-to-word"
                )
            except Exception as db_error:
                print(f"⚠️ DB logging failed: {db_error}")

        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}"
            }
        )

    except HTTPException:
        raise

    except Exception as e:
        print(f"❌ PDF to Word error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while converting PDF to Word."
        )

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─────────────────────────────────────────────
# 2️⃣ WORD → PDF
# ─────────────────────────────────────────────

@router.post("/word-to-pdf")
async def word_to_pdf(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)
):
    file_bytes = await file.read()
    validate_file(file_bytes, file.content_type, ALLOWED_WORD)

    start_time = time.time()
    tmp_dir = tempfile.mkdtemp()

    try:
        docx_path = os.path.join(tmp_dir, file.filename or "input.docx")

        with open(docx_path, "wb") as f:
            f.write(file_bytes)

        result = subprocess.run(
            [
                "libreoffice",
                "--headless",
                "--convert-to", "pdf",
                "--outdir", tmp_dir,
                docx_path
            ],
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode != 0:
            print(f"❌ LibreOffice error: {result.stderr}")
            raise HTTPException(
                status_code=500,
                detail="Conversion failed. Please check your Word file."
            )

        expected_pdf = os.path.join(
            tmp_dir,
            (file.filename or "input.docx").rsplit(".", 1)[0] + ".pdf"
        )

        if not os.path.exists(expected_pdf):
            raise HTTPException(
                status_code=500,
                detail="PDF output not found after conversion."
            )

        with open(expected_pdf, "rb") as f:
            pdf_bytes = f.read()

        duration_ms = int((time.time() - start_time) * 1000)
        output_filename = (file.filename or "document").rsplit(".", 1)[0] + ".pdf"

        if user_id:
            try:
                await log_tool_usage_to_supabase(
                    user_id=user_id,
                    file_name=file.filename or "unknown",
                    file_type=file.content_type,
                    file_size=len(file_bytes),
                    output_size=len(pdf_bytes),
                    duration_ms=duration_ms,
                    tool_name="word-to-pdf"
                )
                await log_file_to_supabase(
                    user_id=user_id,
                    file_name=output_filename,
                    file_size=len(pdf_bytes),
                    file_type="application/pdf",
                    tool_used="word-to-pdf"
                )
            except Exception as db_error:
                print(f"⚠️ DB logging failed: {db_error}")

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}"
            }
        )

    except HTTPException:
        raise

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=500,
            detail="Conversion timed out. Please try with a smaller file."
        )

    except Exception as e:
        print(f"❌ Word to PDF error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while converting Word to PDF."
        )

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─────────────────────────────────────────────
# 3️⃣ PDF → TEXT
# ─────────────────────────────────────────────

@router.post("/pdf-to-text")
async def pdf_to_text(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)
):
    file_bytes = await file.read()
    validate_file(file_bytes, file.content_type, ALLOWED_PDF)

    start_time = time.time()

    try:
        extracted_text = ""

        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n\n"

        extracted_text = extracted_text.strip()

        if not extracted_text:
            extracted_text = "No text found in PDF."

        duration_ms = int((time.time() - start_time) * 1000)

        if user_id:
            try:
                await log_tool_usage_to_supabase(
                    user_id=user_id,
                    file_name=file.filename or "unknown",
                    file_type=file.content_type,
                    file_size=len(file_bytes),
                    output_size=len(extracted_text),
                    duration_ms=duration_ms,
                    tool_name="pdf-to-text"
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
        print(f"❌ PDF to Text error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while extracting text from PDF."
        )