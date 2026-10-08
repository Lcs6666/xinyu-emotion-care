import { env } from "cloudflare:workers";
import { getCurrentUser } from "../../auth";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });

  const form = await request.formData();
  const date = String(form.get("date") || "");
  const mood = String(form.get("mood") || "").trim().slice(0, 12);
  const emoji = String(form.get("emoji") || "🙂").slice(0, 8);
  const note = String(form.get("note") || "").trim().slice(0, 2000);
  const level = Math.max(1, Math.min(10, Number(form.get("level")) || 5));
  let triggers: string[] = [];
  try { triggers = JSON.parse(String(form.get("triggers") || "[]")).slice(0, 10); } catch {}
  if (!DATE_RE.test(date) || !mood) return Response.json({ error: "记录内容不完整" }, { status: 400 });

  const old = await env.DB.prepare("SELECT id FROM records WHERE user_id = ? AND date = ?").bind(user.userId, date).first<{ id: string }>();
  if (old) {
    const oldImages = await env.DB.prepare("SELECT object_key FROM record_images WHERE user_id = ? AND record_id = ?").bind(user.userId, old.id).all<{ object_key: string }>();
    await Promise.all(oldImages.results.map((item) => env.BUCKET.delete(item.object_key)));
    await env.DB.batch([
      env.DB.prepare("DELETE FROM record_images WHERE user_id = ? AND record_id = ?").bind(user.userId, old.id),
      env.DB.prepare("DELETE FROM records WHERE user_id = ? AND id = ?").bind(user.userId, old.id),
    ]);
  }

  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO records (id, user_id, date, mood_name, mood_emoji, level, triggers_json, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, user.userId, date, mood, emoji, level, JSON.stringify(triggers), note, Date.now()).run();

  const files = form.getAll("images").filter((value): value is File => value instanceof File).slice(0, 3);
  const statements: D1PreparedStatement[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/") || file.size > 3_000_000) continue;
    const imageId = crypto.randomUUID();
    const objectKey = `${user.userId}/${id}/${imageId}`;
    await env.BUCKET.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    statements.push(env.DB.prepare("INSERT INTO record_images (id, user_id, record_id, object_key, mime_type, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(imageId, user.userId, id, objectKey, file.type, Date.now()));
  }
  if (statements.length) await env.DB.batch(statements);
  return Response.json({ ok: true });
}
