import { hashPassword, generateToken, getDb, jsonResponse } from "./_utils.js";

export const onRequestPost = async (context) => {
  try {
    const db = getDb(context);
    const body = await context.request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonResponse({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanPassword.length < 6) {
      return jsonResponse({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, 400);
    }

    // Check if user exists
    const existing = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(cleanEmail)
      .first();

    if (existing) {
      return jsonResponse({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, 400);
    }

    // Insert user
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(cleanPassword);
    
    await db
      .prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)")
      .bind(userId, cleanEmail, hashedPassword)
      .run();

    // Generate JWT token
    const token = await generateToken(userId, cleanEmail, context.env.JWT_SECRET);

    return jsonResponse({
      token,
      user: {
        uid: userId,
        email: cleanEmail
      }
    });

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
};
