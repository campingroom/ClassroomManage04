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

    const row = await db
      .prepare("SELECT profile_data, updated_at FROM user_profiles WHERE user_id = ?")
      .bind(userId)
      .first();

    if (!row) {
      return jsonResponse({ semesters: [], trashSemesters: [], currentSemesterId: "" });
    }

    const data = JSON.parse(row.profile_data);
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
    const body = await context.request.json();
    const { semesters, trashSemesters, currentSemesterId, _exportedAt } = body;

    const timestamp = _exportedAt || new Date().toISOString();
    const profile_data = JSON.stringify({ semesters, trashSemesters, currentSemesterId });

    await db
      .prepare(`
        INSERT INTO user_profiles (user_id, profile_data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          profile_data = excluded.profile_data,
          updated_at = excluded.updated_at
      `)
      .bind(userId, profile_data, timestamp)
      .run();

    return jsonResponse({ success: true, updated_at: timestamp });

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
};
