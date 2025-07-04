import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { timestamps } from ".";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    ...timestamps,
  },
  (table) => [
    // Email lookups (login, registration) - although unique constraint exists, explicit index helps
    index("idx_user_email").on(table.email),
  ]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
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

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
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

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ...timestamps,
});
