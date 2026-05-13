from fastapi import APIRouter, HTTPException
import os
import httpx
from datetime import datetime, timezone, timedelta

router = APIRouter()


def get_supabase_headers():
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    return {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
    }


@router.get("/admin/stats")
async def get_admin_stats():
    """Fetch all admin dashboard statistics."""
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = get_supabase_headers()

    async with httpx.AsyncClient() as client:

        # 1. Get all users
        users_res = await client.get(
            f"{supabase_url}/rest/v1/users?select=id,full_name,email,role,avatar_url,created_at&order=created_at.desc",
            headers=headers
        )
        users = users_res.json() if users_res.status_code == 200 else []

        # 2. Get all tool usage
        tool_res = await client.get(
            f"{supabase_url}/rest/v1/tool_usage?select=id,user_id,tool_name,input_size,output_size,duration_ms,status,created_at&order=created_at.desc",
            headers=headers
        )
        tool_data = tool_res.json() if tool_res.status_code == 200 else []

        # 3. Get all quiz attempts
        quiz_res = await client.get(
            f"{supabase_url}/rest/v1/quiz_attempts?select=id,user_id,quiz_id,score,total,percentage,duration_seconds,completed_at&order=completed_at.desc",
            headers=headers
        )
        quiz_data = quiz_res.json() if quiz_res.status_code == 200 else []

        # 4. Get all quizzes
        quizzes_res = await client.get(
            f"{supabase_url}/rest/v1/quizzes?select=id,user_id,title,total_questions,difficulty,created_at&order=created_at.desc",
            headers=headers
        )
        quizzes = quizzes_res.json() if quizzes_res.status_code == 200 else []

    # ── Calculate Stats ──

    total_users = len(users)
    total_conversions = len(tool_data)
    total_quizzes_taken = len(quiz_data)
    total_quizzes_generated = len(quizzes)

    # Tool usage counts
    tool_counts = {}
    for t in tool_data:
        name = t.get("tool_name", "unknown")
        tool_counts[name] = tool_counts.get(name, 0) + 1

    # Average duration
    durations = [t.get("duration_ms", 0) for t in tool_data if t.get("duration_ms")]
    avg_duration_ms = round(sum(durations) / len(durations)) if durations else 0
    avg_duration_sec = round(avg_duration_ms / 1000, 1)

    # Quiz stats
    quiz_percentages = [q.get("percentage", 0) or 0 for q in quiz_data]
    avg_quiz_score = round(sum(quiz_percentages) / len(quiz_percentages), 1) if quiz_percentages else 0

    # Today's stats
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    today_conversions = sum(
        1 for t in tool_data
        if t.get("created_at") and datetime.fromisoformat(t["created_at"].replace("Z", "+00:00")) >= today_start
    )

    today_signups = sum(
        1 for u in users
        if u.get("created_at") and datetime.fromisoformat(u["created_at"].replace("Z", "+00:00")) >= today_start
    )

    # This week stats
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    week_conversions = sum(
        1 for t in tool_data
        if t.get("created_at") and datetime.fromisoformat(t["created_at"].replace("Z", "+00:00")) >= week_start
    )

    # Usage by day (last 7 days)
    daily_usage = {}
    for i in range(7):
        day = now - timedelta(days=6 - i)
        day_label = day.strftime("%a")
        daily_usage[day_label] = 0

    for t in tool_data:
        if t.get("created_at"):
            try:
                dt = datetime.fromisoformat(t["created_at"].replace("Z", "+00:00"))
                if dt >= week_start:
                    label = dt.strftime("%a")
                    if label in daily_usage:
                        daily_usage[label] += 1
            except Exception:
                pass

    # Usage by month (last 12 months)
    monthly_usage = {}
    for i in range(12):
        month = now - timedelta(days=30 * (11 - i))
        month_label = month.strftime("%b")
        monthly_usage[month_label] = 0

    for t in tool_data:
        if t.get("created_at"):
            try:
                dt = datetime.fromisoformat(t["created_at"].replace("Z", "+00:00"))
                label = dt.strftime("%b")
                if label in monthly_usage:
                    monthly_usage[label] += 1
            except Exception:
                pass

    # Per-user stats (for users table)
    user_stats = []
    for u in users:
        uid = u.get("id")
        user_tools = [t for t in tool_data if t.get("user_id") == uid]
        user_quizzes = [q for q in quiz_data if q.get("user_id") == uid]

        # Most used tool
        user_tool_counts = {}
        for t in user_tools:
            name = t.get("tool_name", "unknown")
            user_tool_counts[name] = user_tool_counts.get(name, 0) + 1

        most_used = max(user_tool_counts, key=user_tool_counts.get) if user_tool_counts else "None"

        # Last activity
        last_activity = None
        if user_tools:
            dates = [t.get("created_at") for t in user_tools if t.get("created_at")]
            if dates:
                last_activity = max(dates)

        user_stats.append({
            "id": uid,
            "full_name": u.get("full_name", "Unknown"),
            "email": u.get("email", ""),
            "role": u.get("role", "user"),
            "avatar_url": u.get("avatar_url"),
            "created_at": u.get("created_at", ""),
            "total_uses": len(user_tools),
            "most_used_tool": most_used,
            "quiz_count": len(user_quizzes),
            "last_activity": last_activity,
            "status": "active" if last_activity else "inactive",
        })

    # Recent activity logs
    recent_logs = []
    for t in tool_data[:20]:
        user = next((u for u in users if u.get("id") == t.get("user_id")), None)
        recent_logs.append({
            "user_name": user.get("full_name", "Unknown") if user else "Unknown",
            "user_email": user.get("email", "") if user else "",
            "tool_name": t.get("tool_name", "unknown"),
            "input_size": t.get("input_size", 0),
            "output_size": t.get("output_size", 0),
            "duration_ms": t.get("duration_ms", 0),
            "status": t.get("status", "unknown"),
            "created_at": t.get("created_at", ""),
        })

    return {
        "success": True,
        "stats": {
            "total_users": total_users,
            "total_conversions": total_conversions,
            "today_conversions": today_conversions,
            "today_signups": today_signups,
            "week_conversions": week_conversions,
            "avg_duration_sec": avg_duration_sec,
            "total_quizzes_generated": total_quizzes_generated,
            "total_quizzes_taken": total_quizzes_taken,
            "avg_quiz_score": avg_quiz_score,
        },
        "tool_counts": tool_counts,
        "daily_usage": daily_usage,
        "monthly_usage": monthly_usage,
        "users": user_stats,
        "recent_logs": recent_logs,
    }

@router.get("/admin/notifications")
async def get_notifications(limit: int = 10):
    """Fetch recent activity for notifications."""
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = get_supabase_headers()
    notifications = []

    async with httpx.AsyncClient() as client:
        # 1. Recent signups
        users_res = await client.get(
            f"{supabase_url}/rest/v1/users?select=id,full_name,email,created_at&order=created_at.desc&limit={limit}",
            headers=headers
        )
        users = users_res.json() if users_res.status_code == 200 else []

        for u in users:
            notifications.append({
                "type": "signup",
                "icon": "🆕",
                "title": "New user signed up",
                "message": f"{u.get('full_name', 'Unknown')} joined U-ConvertIT",
                "user_email": u.get("email", ""),
                "timestamp": u.get("created_at", ""),
            })

        # 2. Recent tool usage
        tool_res = await client.get(
            f"{supabase_url}/rest/v1/tool_usage?select=id,user_id,tool_name,created_at&order=created_at.desc&limit={limit}",
            headers=headers
        )
        tool_data = tool_res.json() if tool_res.status_code == 200 else []

        # Get user info for tool usage
        user_ids = list(set([t.get("user_id") for t in tool_data if t.get("user_id")]))
        users_map = {}
        if user_ids:
            ids_str = ",".join([f'"{uid}"' for uid in user_ids])
            user_lookup = await client.get(
                f"{supabase_url}/rest/v1/users?id=in.({ids_str})&select=id,full_name,email",
                headers=headers
            )
            if user_lookup.status_code == 200:
                for u in user_lookup.json():
                    users_map[u["id"]] = u

        tool_emojis = {
            "paraphraser": "📝",
            "humanizer": "🤖",
            "ocr": "🖼️",
            "quiz_maker": "📚",
            "pdf_convert": "📄",
        }

        tool_names = {
            "paraphraser": "Paraphraser",
            "humanizer": "Humanizer",
            "ocr": "OCR",
            "quiz_maker": "Quiz Maker",
            "pdf_convert": "PDF Convert",
        }

        for t in tool_data:
            user = users_map.get(t.get("user_id"), {})
            tool = t.get("tool_name", "unknown")
            notifications.append({
                "type": "tool_usage",
                "icon": tool_emojis.get(tool, "🔧"),
                "title": "Tool used",
                "message": f"{user.get('full_name', 'Someone')} used {tool_names.get(tool, tool)}",
                "user_email": user.get("email", ""),
                "timestamp": t.get("created_at", ""),
            })

        # 3. Recent quiz attempts
        quiz_res = await client.get(
            f"{supabase_url}/rest/v1/quiz_attempts?select=id,user_id,score,total,percentage,completed_at&order=completed_at.desc&limit={limit}",
            headers=headers
        )
        quiz_data = quiz_res.json() if quiz_res.status_code == 200 else []

        for q in quiz_data:
            user = users_map.get(q.get("user_id"), {})
            if q.get("user_id") and q.get("user_id") not in users_map:
                # Fetch this user
                u_res = await client.get(
                    f"{supabase_url}/rest/v1/users?id=eq.{q['user_id']}&select=full_name,email",
                    headers=headers
                )
                if u_res.status_code == 200 and u_res.json():
                    user = u_res.json()[0]

            score = q.get("score", 0)
            total = q.get("total", 0)
            percentage = q.get("percentage", 0) or 0

            score_emoji = "🏆" if percentage >= 90 else "🎯" if percentage >= 70 else "📊"

            notifications.append({
                "type": "quiz_attempt",
                "icon": score_emoji,
                "title": "Quiz completed",
                "message": f"{user.get('full_name', 'Someone')} scored {score}/{total} ({percentage}%)",
                "user_email": user.get("email", ""),
                "timestamp": q.get("completed_at", ""),
            })

    # Sort all notifications by timestamp (newest first)
    notifications.sort(
        key=lambda x: x.get("timestamp", ""),
        reverse=True
    )

    # Limit to requested amount
    notifications = notifications[:limit]

    return {
        "success": True,
        "count": len(notifications),
        "notifications": notifications,
    }