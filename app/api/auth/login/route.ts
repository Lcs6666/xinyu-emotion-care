import { env } from "cloudflare:workers";
import { normalizeUsername, passwordHash, randomToken, sameValue, SESSION_SECONDS, setSessionHeader, sha256 } from "../../../auth";

export async function POST(request: Request) {
  const body = await request.json() as { username?: string; password?: string };
  const username = normalizeUsername(String(body.username || ""));
  const password = String(body.password || "");
  const user = await env.DB.prepare("SELECT id, password_hash, password_salt, failed_attempts, locked_until FROM users WHERE username = ?")
    .bind(username).first<{ id: string; password_hash: string; password_salt: string; failed_attempts: number; locked_until: number }>();
  if (!user) return Response.json({ error: "账号名或密码不正确" }, { status: 401 });
  if (user.locked_until > Date.now()) return Response.json({ error: "尝试次数过多，请 15 分钟后再试" }, { status: 429 });
  const candidate = await passwordHash(password, user.password_salt);
  if (!sameValue(candidate.hash, user.password_hash)) {
    const failures = user.failed_attempts + 1;
    await env.DB.prepare("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?")
      .bind(failures >= 5 ? 0 : failures, failures >= 5 ? Date.now() + 15 * 60 * 1000 : 0, user.id).run();
    return Response.json({ error: failures >= 5 ? "尝试次数过多，请 15 分钟后再试" : "账号名或密码不正确" }, { status: failures >= 5 ? 429 : 401 });
  }
  const token = randomToken(); const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?").bind(user.id),
    env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind(await sha256(token), user.id, now + SESSION_SECONDS * 1000, now),
  ]);
  return Response.json({ ok: true }, { headers: { "set-cookie": setSessionHeader(token) } });
}
