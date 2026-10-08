import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json() as { category?: string; message?: string };
  const category = String(body.category || "产品建议").slice(0, 20);
  const message = String(body.message || "").trim().slice(0, 2000);
  if (message.length < 2) return Response.json({ error: "请写下你的建议" }, { status: 400 });
  await env.DB.prepare("INSERT INTO feedback (id, user_id, category, message, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), user.userId, category, message, Date.now()).run();
  return Response.json({ ok: true });
}
