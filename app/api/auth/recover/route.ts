import { env } from "cloudflare:workers";
import { normalizeUsername, passwordHash, randomToken, recoveryCode, sameValue, SESSION_SECONDS, setSessionHeader, sha256 } from "../../../auth";

export async function POST(request: Request) {
  const body = await request.json() as { username?: string; recoveryCode?: string; newPassword?: string };
  const username = normalizeUsername(String(body.username || ""));
  const newPassword = String(body.newPassword || "");
  const providedRecoveryHash = await sha256(String(body.recoveryCode || "").toUpperCase().replaceAll("-", "").replaceAll(" ", ""));
  if (newPassword.length < 8 || newPassword.length > 128) return Response.json({ error: "新密码长度需为 8–128 位" }, { status: 400 });
  const user = await env.DB.prepare("SELECT id, recovery_hash FROM users WHERE username = ?").bind(username).first<{ id: string; recovery_hash: string }>();
  if (!user || !sameValue(providedRecoveryHash, user.recovery_hash)) return Response.json({ error: "账号名或恢复码不正确" }, { status: 401 });

  const passwordData = await passwordHash(newPassword); const nextRecovery = recoveryCode(); const token = randomToken(); const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash = ?, password_salt = ?, recovery_hash = ?, failed_attempts = 0, locked_until = 0 WHERE id = ?")
      .bind(passwordData.hash, passwordData.salt, await sha256(nextRecovery.replaceAll("-", "")), user.id),
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
    env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind(await sha256(token), user.id, now + SESSION_SECONDS * 1000, now),
  ]);
  return Response.json({ ok: true, recoveryCode: nextRecovery }, { headers: { "set-cookie": setSessionHeader(token) } });
}
