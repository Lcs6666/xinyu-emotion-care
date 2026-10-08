import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });

  const [recordsResult, imagesResult, moodsResult] = await Promise.all([
    env.DB.prepare("SELECT id, date, mood_name, mood_emoji, level, triggers_json, note FROM records WHERE user_id = ? ORDER BY date ASC").bind(user.userId).all(),
    env.DB.prepare("SELECT id, record_id FROM record_images WHERE user_id = ? ORDER BY created_at ASC").bind(user.userId).all(),
    env.DB.prepare("SELECT id, name, emoji FROM custom_moods WHERE user_id = ? ORDER BY created_at ASC").bind(user.userId).all(),
  ]);

  const imageMap = new Map<string, string[]>();
  for (const image of imagesResult.results as { id: string; record_id: string }[]) {
    const list = imageMap.get(image.record_id) ?? [];
    list.push(`/api/images/${encodeURIComponent(image.id)}`);
    imageMap.set(image.record_id, list);
  }

  const records = (recordsResult.results as Record<string, unknown>[]).map((record) => ({
    id: record.id,
    date: record.date,
    mood: record.mood_name,
    emoji: record.mood_emoji,
    level: record.level,
    triggers: JSON.parse(String(record.triggers_json || "[]")),
    note: record.note,
    images: imageMap.get(String(record.id)) ?? [],
  }));

  return Response.json({ records, moods: moodsResult.results });
}
