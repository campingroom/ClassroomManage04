// Cloudflare Pages Functions utilities

function base64urlEncode(str) {
  return btoa(str)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

export async function hashPassword(password) {
  const salt = "classroom-salt-12345"; // Secure salt
  const myText = new TextEncoder().encode(password + salt);
  const myDigest = await crypto.subtle.digest({ name: 'SHA-256' }, myText);
  const hashArray = Array.from(new Uint8Array(myDigest));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateToken(userId, email, secret) {
  const jwtSecret = secret || "default-secret-key-12345";
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64urlEncode(JSON.stringify({ userId, email, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })); // 30 days
  
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${header}.${payload}`)
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  return `${header}.${payload}.${signature}`;
}

export async function verifyToken(token, secret) {
  const jwtSecret = secret || "default-secret-key-12345";
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${header}.${payload}`)
    );
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    
    if (signature !== expectedSignature) return null;
    
    const decodedPayloadStr = base64urlDecode(payload);
    const parsedPayload = JSON.parse(decodedPayloadStr);
    
    if (parsedPayload.exp < Date.now()) return null; // Expired
    return parsedPayload;
  } catch (e) {
    return null;
  }
}

export function getDb(context) {
  const db = context.env.DB;
  if (!db) {
    throw new Error("D1 database binding 'DB' is missing. Please configure it in your Wrangler settings.");
  }
  return db;
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
