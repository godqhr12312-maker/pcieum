import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  nickname: text("nickname").notNull(),
  region: text("region").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("profiles_nickname_unique").on(table.nickname)]);

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  region: text("region").notNull(),
  district: text("district").notNull().default(""),
  price: integer("price"),
  premium: integer("premium"),
  deposit: integer("deposit"),
  seats: integer("seats"),
  contact: text("contact").notNull().default(""),
  images: text("images").notNull().default("[]"),
  authorId: text("author_id").notNull().references(() => profiles.id),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  views: integer("views").notNull().default(0),
}, (table) => [
  index("posts_kind_status_created").on(table.kind, table.status, table.createdAt),
  index("posts_author_created").on(table.authorId, table.createdAt),
]);

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id),
  authorId: text("author_id").notNull().references(() => profiles.id),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("comments_post_created").on(table.postId, table.createdAt)]);

export const favorites = sqliteTable("favorites", {
  userId: text("user_id").notNull(),
  postId: text("post_id").notNull().references(() => posts.id),
  createdAt: text("created_at").notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.postId] })]);

export const uploads = sqliteTable("uploads", {
  key: text("key").primaryKey(),
  userId: text("user_id").notNull(),
  size: integer("size").notNull(),
  contentType: text("content_type").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("uploads_user_created").on(table.userId, table.createdAt)]);
