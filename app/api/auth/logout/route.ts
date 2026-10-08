import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { clearSessionHeader, SESSION_COOKIE, sha256 } from "../../../auth";

export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return Response.json({ ok: true }, { headers: { "set-cookie": clearSessionHeader() } });
}
