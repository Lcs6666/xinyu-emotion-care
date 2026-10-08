import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const records = sqliteTable("records", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  moodName: text("mood_name").notNull(),
  moodEmoji: text("mood_emoji").notNull(),
  level: integer("level").notNull(),
  triggersJson: text("triggers_json").notNull().default("[]"),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at").notNull(),
}, (table) => [uniqueIndex("records_user_date_idx").on(table.userId, table.date)]);

export const recordImages = sqliteTable("record_images", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  recordId: text("record_id").notNull(),
  objectKey: text("object_key").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const customMoods = sqliteTable("custom_moods", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [uniqueIndex("moods_user_name_idx").on(table.userId, table.name)]);

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  recoveryHash: text("recovery_hash").notNull(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: integer("locked_until").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});
