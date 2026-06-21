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

    // Retrieve user
    const user = await db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(cleanEmail)
      .first();

    if (!user) {
      return jsonResponse({ error: "ไม่พบอีเมลนี้ในระบบ หรือรหัสผ่านไม่ถูกต้อง" }, 401);
    }

    // Verify password
    const hashedInput = await hashPassword(cleanPassword);
    if (hashedInput !== user.password_hash) {
      return jsonResponse({ error: "ไม่พบอีเมลนี้ในระบบ หรือรหัสผ่านไม่ถูกต้อง" }, 401);
    }

    // Generate JWT token
    const token = await generateToken(user.id, cleanEmail, context.env.JWT_SECRET);

    return jsonResponse({
      token,
      user: {
        uid: user.id,
        email: cleanEmail
      }
    });

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
};
