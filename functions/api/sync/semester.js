import { verifyToken, getDb, jsonResponse } from "../_utils.js";

async function authUser(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  return await verifyToken(token, env.JWT_SECRET);
}

export const onRequestGet = async (context) => {
  try {
    const db = getDb(context);
    const decoded = await authUser(context.request, context.env);
    if (!decoded) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = decoded.userId;
    
    // Parse query parameter: semester_id
    const url = new URL(context.request.url);
    const semesterId = url.searchParams.get("semester_id");

    if (!semesterId) {
      return jsonResponse({ error: "กรุณาระบุ semester_id" }, 400);
    }

    const row = await db
      .prepare("SELECT semester_data, updated_at FROM user_semesters WHERE user_id = ? AND semester_id = ?")
      .bind(userId, semesterId)
      .first();

    if (!row) {
      return jsonResponse({ error: "ไม่พบข้อมูลภาคเรียนนี้ในเซิร์ฟเวอร์" }, 404);
    }

    const data = JSON.parse(row.semester_data);
    data._exportedAt = row.updated_at;
    return jsonResponse(data);

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
};

export const onRequestPost = async (context) => {
  try {
    const db = getDb(context);
    const decoded = await authUser(context.request, context.env);
    if (!decoded) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = decoded.userId;

    // The session's userId may no longer exist (e.g. account deleted, or a
    // stale token from before the database was reset). Both user_profiles
    // and user_semesters have a FOREIGN KEY straight to users(id), so check
    // this up front instead of letting the INSERT below fail with a raw
    // D1 constraint error the client can't recover from.
    const userExists = await db.prepare("SELECT 1 FROM users WHERE id = ?").bind(userId).first();
    if (!userExists) {
      return jsonResponse({ error: "บัญชีผู้ใช้นี้ไม่มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบใหม่", code: "USER_NOT_FOUND" }, 401);
    }

    const body = await context.request.json();

    const url = new URL(context.request.url);
    const semesterId = url.searchParams.get("semester_id") || body.semester_id || body.currentSemesterId;

    if (!semesterId) {
      return jsonResponse({ error: "กรุณาระบุ semester_id" }, 400);
    }

    const timestamp = new Date().toISOString();
    body._exportedAt = timestamp;
    const semester_data = JSON.stringify(body);

    // Also seed a default user_profiles row so a semester-first sync (no
    // profile pushed yet) has something for GET /sync/profile to find.
    const defaultProfile = JSON.stringify({
      semesters: [{ id: semesterId, name: semesterId }],
      trashSemesters: [],
      currentSemesterId: semesterId
    });
    await db
      .prepare(`
        INSERT OR IGNORE INTO user_profiles (user_id, profile_data, updated_at)
        VALUES (?, ?, ?)
      `)
      .bind(userId, defaultProfile, timestamp)
      .run();

    await db
      .prepare(`
        INSERT INTO user_semesters (user_id, semester_id, semester_data, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, semester_id) DO UPDATE SET
          semester_data = excluded.semester_data,
          updated_at = excluded.updated_at
      `)
      .bind(userId, semesterId, semester_data, timestamp)
      .run();

    return jsonResponse({ success: true, updated_at: timestamp });

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
};
