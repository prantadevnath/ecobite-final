import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  restaurants,
  boxes,
  reservations,
  InsertRestaurant,
  InsertBox,
  InsertReservation,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
  for (const field of textFields) {
    const value = user[field as keyof InsertUser];
    if (value === undefined) continue;
    const normalized = value ?? null;
    (values as Record<string, unknown>)[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ─── Restaurants ─────────────────────────────────────────────────────────────

export async function createRestaurant(data: InsertRestaurant) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(restaurants).values(data);
}

export async function getRestaurantByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(eq(restaurants.userId, userId)).limit(1);
  return result[0];
}

export async function getRestaurantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  return result[0];
}

export async function getAllRestaurants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(restaurants).orderBy(desc(restaurants.createdAt));
}

export async function approveRestaurant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(restaurants).set({ status: "approved" }).where(eq(restaurants.id, id));
}

export async function rejectRestaurant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(restaurants).set({ status: "rejected" }).where(eq(restaurants.id, id));
}

// ─── Boxes ───────────────────────────────────────────────────────────────────

export async function createBox(data: InsertBox) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(boxes).values(data);
}

export async function updateBox(id: number, data: Partial<InsertBox>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(boxes).set(data).where(eq(boxes.id, id));
}

export async function softDeleteBox(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(boxes).set({ isActive: false }).where(eq(boxes.id, id));
}

export async function getBoxesByRestaurantId(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(boxes)
    .where(and(eq(boxes.restaurantId, restaurantId), eq(boxes.isActive, true)))
    .orderBy(desc(boxes.createdAt));
}

export async function getBoxById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(boxes).where(eq(boxes.id, id)).limit(1);
  return result[0];
}

export async function getAvailableBoxes() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      box: boxes,
      restaurant: restaurants,
    })
    .from(boxes)
    .innerJoin(restaurants, eq(boxes.restaurantId, restaurants.id))
    .where(
      and(
        eq(boxes.isActive, true),
        eq(restaurants.status, "approved")
      )
    )
    .orderBy(desc(boxes.createdAt));
}

export async function decrementBoxQty(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(boxes)
    .set({ quantityAvailable: sql`quantityAvailable - 1` })
    .where(and(eq(boxes.id, id), sql`quantityAvailable > 0`));
}

export async function incrementBoxQty(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(boxes)
    .set({ quantityAvailable: sql`quantityAvailable + 1` })
    .where(eq(boxes.id, id));
}

// ─── Reservations ────────────────────────────────────────────────────────────

export async function createReservation(data: InsertReservation) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(reservations).values(data);
}

export async function getReservationsByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      reservation: reservations,
      box: boxes,
      restaurant: restaurants,
    })
    .from(reservations)
    .innerJoin(boxes, eq(reservations.boxId, boxes.id))
    .innerJoin(restaurants, eq(boxes.restaurantId, restaurants.id))
    .where(eq(reservations.customerId, customerId))
    .orderBy(desc(reservations.createdAt));
}

export async function getReservationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return result[0];
}

export async function getReservationByPin(pin: string, restaurantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  // Find active reservation with this PIN for boxes belonging to this restaurant
  const result = await db
    .select({ reservation: reservations, box: boxes, customer: users })
    .from(reservations)
    .innerJoin(boxes, eq(reservations.boxId, boxes.id))
    .innerJoin(users, eq(reservations.customerId, users.id))
    .where(
      and(
        eq(reservations.pin, pin),
        eq(reservations.status, "active"),
        eq(boxes.restaurantId, restaurantId)
      )
    )
    .limit(1);
  return result[0];
}

export async function getReservationByQrToken(qrToken: string, restaurantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ reservation: reservations, box: boxes, customer: users })
    .from(reservations)
    .innerJoin(boxes, eq(reservations.boxId, boxes.id))
    .innerJoin(users, eq(reservations.customerId, users.id))
    .where(
      and(
        eq(reservations.qrToken, qrToken),
        eq(reservations.status, "active"),
        eq(boxes.restaurantId, restaurantId)
      )
    )
    .limit(1);
  return result[0];
}

export async function updateReservationStatus(
  id: number,
  status: "active" | "picked_up" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(reservations).set({ status }).where(eq(reservations.id, id));
}

export async function getReservationsByRestaurantId(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      reservation: reservations,
      box: boxes,
      customer: users,
    })
    .from(reservations)
    .innerJoin(boxes, eq(reservations.boxId, boxes.id))
    .innerJoin(users, eq(reservations.customerId, users.id))
    .where(eq(boxes.restaurantId, restaurantId))
    .orderBy(desc(reservations.createdAt));
}
