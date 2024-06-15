import { relations, sql } from "drizzle-orm";
import {
  index,
  int,
  primaryKey,
  sqliteTableCreator,
  text,
  integer,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const createTable = sqliteTableCreator((name) => `${name}`);

export const users = createTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export type User = typeof users.$inferSelect;

export const accounts = createTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = createTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = createTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticators = createTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: integer("credentialBackedUp", {
      mode: "boolean",
    }).notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

export const storedContent = createTable(
  "storedContent",
  {
    id: integer("id").notNull().primaryKey({ autoIncrement: true }),
    content: text("content").notNull(),
    title: text("title", { length: 255 }),
    description: text("description", { length: 255 }),
    url: text("url").notNull(),
    savedAt: int("savedAt", { mode: "timestamp" }).notNull(),
    baseUrl: text("baseUrl", { length: 255 }),
    ogImage: text("ogImage", { length: 255 }),
    type: text("type", { enum: ["note", "page", "twitter-bookmark"] }).default(
      "page",
    ),
    image: text("image", { length: 255 }),
    userId: int("user").references(() => users.id, {
      onDelete: "cascade",
    }),
  },
  (sc) => ({
    urlIdx: index("storedContent_url_idx").on(sc.url),
    savedAtIdx: index("storedContent_savedAt_idx").on(sc.savedAt),
    titleInx: index("storedContent_title_idx").on(sc.title),
    userIdx: index("storedContent_user_idx").on(sc.userId),
  }),
);

export const contentToSpace = createTable(
  "contentToSpace",
  {
    contentId: integer("contentId")
      .notNull()
      .references(() => storedContent.id, { onDelete: "cascade" }),
    spaceId: integer("spaceId")
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
  },
  (cts) => ({
    compoundKey: primaryKey({ columns: [cts.contentId, cts.spaceId] }),
  }),
);

export const space = createTable(
  "space",
  {
    id: integer("id").notNull().primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique().default("none"),
    user: text("user", { length: 255 }).references(() => users.id, {
      onDelete: "cascade",
    }),
  },
  (space) => ({
    nameIdx: index("spaces_name_idx").on(space.name),
    userIdx: index("spaces_user_idx").on(space.user),
  }),
);

export type StoredContent = Omit<typeof storedContent.$inferSelect, "user">;
export type StoredSpace = typeof space.$inferSelect;
export type ChachedSpaceContent = StoredContent & {
  space: number;
};
