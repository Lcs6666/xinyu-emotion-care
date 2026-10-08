import { env } from "cloudflare:workers";
import { getCurrentUser } from "../../auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json() as { name?: string; emoji?: string };
  const name = String(body.name || "").trim().slice(0, 8);
  const emoji = String(body.emoji || "🙂").trim().slice(0, 8);
  if (!name) return Response.json({ error: "请输入心情名称" }, { status: 400 });
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare("INSERT INTO custom_moods (id, user_id, name, emoji, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(id, user.userId, name, emoji || "🙂", Date.now()).run();
  } catch {
    return Response.json({ error: "这个心情已经添加过了" }, { status: 409 });
  }
  return Response.json({ id, name, emoji: emoji || "🙂" });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const { id } = await request.json() as { id?: string };
  await env.DB.prepare("DELETE FROM custom_moods WHERE id = ? AND user_id = ?").bind(id || "", user.userId).run();
  return Response.json({ ok: true });
}
