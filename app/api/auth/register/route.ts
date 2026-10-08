import { env } from "cloudflare:workers";
import { normalizeUsername, passwordHash, randomToken, recoveryCode, SESSION_SECONDS, setSessionHeader, sha256, validUsername } from "../../../auth";

export async function POST(request: Request) {
  const body = await request.json() as { username?: string; password?: string };
  const displayName = String(body.username || "").normalize("NFKC").trim();
  const username = normalizeUsername(displayName);
  const password = String(body.password || "");
  if (!validUsername(username)) return Response.json({ error: "账号名需为 3–24 个中文、字母、数字、下划线或短横线" }, { status: 400 });
  if (password.length < 8 || password.length > 128) return Response.json({ error: "密码长度需为 8–128 位" }, { status: 400 });

  const id = crypto.randomUUID();
  const passwordData = await passwordHash(password);
  const recovery = recoveryCode();
  const token = randomToken();
  const now = Date.now();
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO users (id, username, display_name, password_hash, password_salt, recovery_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(id, username, displayName, passwordData.hash, passwordData.salt, await sha256(recovery.replaceAll("-", "")), now),
      env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
        .bind(await sha256(token), id, now + SESSION_SECONDS * 1000, now),
    ]);
  } catch {
    return Response.json({ error: "这个账号名已被使用，请换一个" }, { status: 409 });
  }
  return Response.json({ ok: true, recoveryCode: recovery }, { headers: { "set-cookie": setSessionHeader(token) } });
}
