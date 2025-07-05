import {
  boolean,
  index,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { timestamps } from "./utils";

export const user = mysqlTable(
  "user",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    name: text("name").notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    ...timestamps,
  },
  (table) => [
    // Email lookups (login, registration) - although unique constraint exists, explicit index helps
    index("idx_user_email").on(table.email),
  ]
);

export const session = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    // Session lookups by token (every authenticated request) - most frequent query
    index("idx_session_token").on(table.token),
    // Session lookups by user (user session management)
    index("idx_session_user_id").on(table.userId),
    // Active sessions cleanup (expired session cleanup)
    index("idx_session_expires_at").on(table.expiresAt),
  ]
);

export const account = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    // Account lookups by user (OAuth account linking)
    index("idx_account_user_id").on(table.userId),
    // Account lookups by provider (OAuth provider queries)
    index("idx_account_provider_account").on(table.providerId, table.accountId),
  ]
);

export const verification = mysqlTable("verification", {
  id: varchar("id", { length: 255 }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ...timestamps,
});
