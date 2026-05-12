import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  pgEnum,
  decimal,
  boolean,
  integer
} from "drizzle-orm/pg-core";

// 1. Define Enums first in Postgres
export const roleEnum = pgEnum("role", ["user", "admin", "customer", "restaurant"]);
export const statusEnum = pgEnum("status", ["pending", "approved", "rejected"]);
export const reservationStatusEnum = pgEnum("status", ["active", "picked_up", "cancelled"]);

// 2. Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(), // serial is the Postgres version of autoincrement
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("customer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: statusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const boxes = pgTable("boxes", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurantId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  normalPrice: decimal("normalPrice", { precision: 10, scale: 2 }).notNull(),
  discountedPrice: decimal("discountedPrice", { precision: 10, scale: 2 }).notNull(),
  quantityAvailable: integer("quantityAvailable").notNull().default(0),
  pickupTimeStart: varchar("pickupTimeStart", { length: 5 }),
  pickupTimeEnd: varchar("pickupTimeEnd", { length: 5 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  customerId: integer("customerId").notNull(),
  boxId: integer("boxId").notNull(),
  quantity: integer("quantity").notNull().default(1),
  status: reservationStatusEnum("status").default("active").notNull(),
  pin: varchar("pin", { length: 6 }).notNull(),
  qrToken: varchar("qrToken", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});