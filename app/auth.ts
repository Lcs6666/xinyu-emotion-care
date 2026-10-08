import { env } from "cloudflare:workers";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "xinyu_session";
export const SESSION_SECONDS = 60 * 60 * 24 * 30;

export type XinyuUser = { userId: string; username: string; displayName: string };

function toBase64(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function randomToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return toBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function recoveryCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const raw = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return raw.match(/.{1,5}/g)!.join("-");
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toBase64(new Uint8Array(digest));
}

export async function passwordHash(password: string, salt = randomToken(18)) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const base64Salt = salt.replaceAll("-", "+").replaceAll("_", "/");
  const paddedSalt = base64Salt + "=".repeat((4 - base64Salt.length % 4) % 4);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromBase64(paddedSalt), iterations: 100_000 }, material, 256);
  return { salt, hash: toBase64(new Uint8Array(bits)) };
}

export function sameValue(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export function normalizeUsername(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
}

export function validUsername(value: string) {
  return /^[\p{L}\p{N}_-]{3,24}$/u.test(value);
}

export function setSessionHeader(token: string) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function getCurrentUser(): Promise<XinyuUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare("SELECT users.id, users.username, users.display_name FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?")
    .bind(tokenHash, Date.now()).first<{ id: string; username: string; display_name: string }>();
  return row ? { userId: row.id, username: row.username, displayName: row.display_name } : null;
}
