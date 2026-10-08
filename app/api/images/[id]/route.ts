import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await context.params;
  const image = await env.DB.prepare("SELECT object_key, mime_type FROM record_images WHERE id = ? AND user_id = ?")
    .bind(id, user.userId).first<{ object_key: string; mime_type: string }>();
  if (!image) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(image.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "content-type": image.mime_type, "cache-control": "private, max-age=3600" } });
}
