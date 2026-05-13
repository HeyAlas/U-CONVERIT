from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import os
import httpx
import base64
import uuid

router = APIRouter()


def get_supabase_headers():
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    return {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    """Fetch user profile + stats from Supabase."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = get_supabase_headers()

    async with httpx.AsyncClient() as client:
        # 1. Get user profile
        user_res = await client.get(
            f"{supabase_url}/rest/v1/users?id=eq.{user_id}&select=*",
            headers=headers
        )

        if user_res.status_code != 200 or not user_res.json():
            raise HTTPException(status_code=404, detail="User not found")

        user = user_res.json()[0]

        # 2. Get tool usage stats
        tool_res = await client.get(
            f"{supabase_url}/rest/v1/tool_usage?user_id=eq.{user_id}&select=tool_name,input_size,output_size",
            headers=headers
        )
        tool_data = tool_res.json() if tool_res.status_code == 200 else []

        # 3. Get quiz attempt stats
        quiz_res = await client.get(
            f"{supabase_url}/rest/v1/quiz_attempts?user_id=eq.{user_id}&select=score,total,percentage",
            headers=headers
        )
        quiz_data = quiz_res.json() if quiz_res.status_code == 200 else []

        # Calculate stats
        total_tools_used = len(tool_data)

        # Count per tool
        tool_counts = {}
        for t in tool_data:
            name = t.get("tool_name", "unknown")
            tool_counts[name] = tool_counts.get(name, 0) + 1

        most_used_tool = max(tool_counts, key=tool_counts.get) if tool_counts else "None"

        total_quizzes = len(quiz_data)
        avg_score = 0
        best_score = 0
        if quiz_data:
            percentages = [q.get("percentage", 0) or 0 for q in quiz_data]
            avg_score = round(sum(percentages) / len(percentages), 1)
            best_score = round(max(percentages), 1)

        total_chars = sum(
            (t.get("input_size", 0) or 0) + (t.get("output_size", 0) or 0)
            for t in tool_data
        )

        return {
            "success": True,
            "profile": {
                "id": user.get("id"),
                "full_name": user.get("full_name", ""),
                "email": user.get("email", ""),
                "role": user.get("role", "user"),
                "avatar_url": user.get("avatar_url", None),
                "created_at": user.get("created_at", ""),
            },
            "stats": {
                "total_tools_used": total_tools_used,
                "most_used_tool": most_used_tool,
                "tool_counts": tool_counts,
                "total_quizzes": total_quizzes,
                "avg_quiz_score": avg_score,
                "best_quiz_score": best_score,
                "total_chars_processed": total_chars,
            }
        }


@router.put("/profile/{user_id}")
async def update_profile(user_id: str, full_name: str = Form(...)):
    """Update user profile name."""
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = get_supabase_headers()

    payload = {"full_name": full_name}

    async with httpx.AsyncClient() as client:
        r = await client.patch(
            f"{supabase_url}/rest/v1/users?id=eq.{user_id}",
            json=payload,
            headers=headers
        )

    if r.status_code not in (200, 204):
        print(f"❌ Profile update failed: {r.status_code} - {r.text}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

    return {"success": True, "message": "Profile updated"}


@router.post("/profile/{user_id}/avatar")
async def upload_avatar(user_id: str, file: UploadFile = File(...)):
    """Upload avatar to Supabase Storage and update user profile."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    # Validate file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be less than 5MB")

    # Generate unique filename
    ext = file.filename.split(".")[-1] if file.filename else "png"
    file_name = f"{user_id}/{uuid.uuid4().hex}.{ext}"

    # Upload to Supabase Storage
    storage_headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": file.content_type,
        "x-upsert": "true",
    }

    async with httpx.AsyncClient() as client:
        upload_res = await client.post(
            f"{supabase_url}/storage/v1/object/avatars/{file_name}",
            content=file_bytes,
            headers=storage_headers
        )

    if upload_res.status_code not in (200, 201):
        print(f"❌ Avatar upload failed: {upload_res.status_code} - {upload_res.text}")
        raise HTTPException(status_code=500, detail="Failed to upload avatar")

    # Build public URL
    avatar_url = f"{supabase_url}/storage/v1/object/public/avatars/{file_name}"

    # Update user profile with avatar URL
    update_headers = get_supabase_headers()

    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{supabase_url}/rest/v1/users?id=eq.{user_id}",
            json={"avatar_url": avatar_url},
            headers=update_headers
        )

    return {"success": True, "avatar_url": avatar_url}