import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { nanoid } from "nanoid";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";
import {
  upsertUser,
  getUserByEmail,
  getUserById,
  getAllUsers,
  createRestaurant,
  getRestaurantByUserId,
  getRestaurantById,
  getAllRestaurants,
  approveRestaurant,
  rejectRestaurant,
  createBox,
  updateBox,
  softDeleteBox,
  getBoxesByRestaurantId,
  getBoxById,
  getAvailableBoxes,
  decrementBoxQtyByAmount,
  incrementBoxQtyByAmount,
  createReservation,
  getReservationsByCustomerId,
  getReservationById,
  getReservationByPin,
  getReservationByQrToken,
  updateReservationStatus,
  getReservationsByRestaurantId,
} from "./db";

// ─── Middleware ───────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const restaurantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "restaurant" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Restaurant access required" });
  }
  return next({ ctx });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, { width: 256, margin: 2 });
}

// ─── Router ──────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    signup: publicProcedure
      .input(
        z.object({
          name: z.string().min(2),
          email: z.string().email(),
          password: z.string().min(6),
          role: z.enum(["customer", "restaurant"]),
          restaurantName: z.string().optional(),
          restaurantDescription: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        const openId = `email_${nanoid(16)}`;
        await upsertUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
          loginMethod: "email",
          role: input.role,
        });
        const user = await getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        if (input.role === "restaurant") {
          await createRestaurant({
            userId: user.id,
            name: input.restaurantName || input.name,
            description: input.restaurantDescription || null,
            status: "pending",
          });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, { expiresInMs: ONE_YEAR_MS, name: user.name || "User" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.setHeader("Set-Cookie", `${COOKIE_NAME}=${sessionToken}; Path=/; ${cookieOptions.secure ? "Secure; " : ""}${cookieOptions.sameSite ? `SameSite=${cookieOptions.sameSite}; ` : ""}HttpOnly; Max-Age=${ONE_YEAR_MS / 1000}`);
        return {
          success: true,
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
        };
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        const sessionToken = await sdk.createSessionToken(user.openId, { expiresInMs: ONE_YEAR_MS, name: user.name || "User" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.setHeader("Set-Cookie", `${COOKIE_NAME}=${sessionToken}; Path=/; ${cookieOptions.secure ? "Secure; " : ""}${cookieOptions.sameSite ? `SameSite=${cookieOptions.sameSite}; ` : ""}HttpOnly; Max-Age=${ONE_YEAR_MS / 1000}`);

        return {
          success: true,
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
        };
      }),
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    listUsers: adminProcedure.query(async () => {
      return getAllUsers();
    }),
    listRestaurants: adminProcedure.query(async () => {
      return getAllRestaurants();
    }),
    approveRestaurant: adminProcedure
      .input(z.object({ restaurantId: z.number() }))
      .mutation(async ({ input }) => {
        await approveRestaurant(input.restaurantId);
        return { success: true };
      }),
    rejectRestaurant: adminProcedure
      .input(z.object({ restaurantId: z.number() }))
      .mutation(async ({ input }) => {
        await rejectRestaurant(input.restaurantId);
        return { success: true };
      }),
  }),

  // ── Restaurant ────────────────────────────────────────────────────────────
  restaurant: router({
    getProfile: restaurantProcedure.query(async ({ ctx }) => {
      const restaurant = await getRestaurantByUserId(ctx.user.id);
      if (!restaurant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Restaurant profile not found" });
      }
      return restaurant;
    }),
    listBoxes: restaurantProcedure.query(async ({ ctx }) => {
      const restaurant = await getRestaurantByUserId(ctx.user.id);
      if (!restaurant) return [];
      return getBoxesByRestaurantId(restaurant.id);
    }),
    createBox: restaurantProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          normalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
          discountedPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
          quantityAvailable: z.number().int().min(0),
          pickupTimeStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
          pickupTimeEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const restaurant = await getRestaurantByUserId(ctx.user.id);
        if (!restaurant) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Restaurant profile not found" });
        }
        if (restaurant.status !== "approved") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Restaurant must be approved before creating boxes",
          });
        }
        await createBox({
          restaurantId: restaurant.id,
          title: input.title,
          description: input.description ?? null,
          normalPrice: input.normalPrice,
          discountedPrice: input.discountedPrice,
          quantityAvailable: input.quantityAvailable,
          pickupTimeStart: input.pickupTimeStart ?? null,
          pickupTimeEnd: input.pickupTimeEnd ?? null,
          isActive: true,
        });
        return { success: true };
      }),
    updateBox: restaurantProcedure
      .input(
        z.object({
          boxId: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          normalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
          discountedPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
          quantityAvailable: z.number().int().min(0).optional(),
          pickupTimeStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
          pickupTimeEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const restaurant = await getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: "NOT_FOUND" });
        const box = await getBoxById(input.boxId);
        if (!box || box.restaurantId !== restaurant.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Box does not belong to your restaurant" });
        }
        const { boxId, ...updates } = input;
        await updateBox(boxId, updates);
        return { success: true };
      }),
    deleteBox: restaurantProcedure
      .input(z.object({ boxId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const restaurant = await getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: "NOT_FOUND" });
        const box = await getBoxById(input.boxId);
        if (!box || box.restaurantId !== restaurant.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await softDeleteBox(input.boxId);
        return { success: true };
      }),
    redeemByPin: restaurantProcedure
      .input(z.object({ pin: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const restaurant = await getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: "NOT_FOUND" });
        const result = await getReservationByPin(input.pin, restaurant.id);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No active reservation found for this PIN" });
        }
        await updateReservationStatus(result.reservation.id, "picked_up");
        return {
          success: true,
          reservation: result.reservation,
          box: result.box,
          customer: { name: result.customer.name, email: result.customer.email },
        };
      }),
    redeemByQr: restaurantProcedure
      .input(z.object({ qrToken: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const restaurant = await getRestaurantByUserId(ctx.user.id);
        if (!restaurant) throw new TRPCError({ code: "NOT_FOUND" });
        const result = await getReservationByQrToken(input.qrToken, restaurant.id);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No active reservation found for this QR code" });
        }
        await updateReservationStatus(result.reservation.id, "picked_up");
        return {
          success: true,
          reservation: result.reservation,
          box: result.box,
          customer: { name: result.customer.name, email: result.customer.email },
        };
      }),
    listReservations: restaurantProcedure.query(async ({ ctx }) => {
      const restaurant = await getRestaurantByUserId(ctx.user.id);
      if (!restaurant) return [];
      return getReservationsByRestaurantId(restaurant.id);
    }),
  }),

  // ── Customer / Boxes ──────────────────────────────────────────────────────
  boxes: router({
    listAvailable: publicProcedure.query(async () => {
      return getAvailableBoxes();
    }),
  }),

  // ── Customer / Reservations ───────────────────────────────────────────────
  reservations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getReservationsByCustomerId(ctx.user.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          boxId: z.number(),
          quantity: z.number().int().min(1).default(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const box = await getBoxById(input.boxId);
        if (!box || !box.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Box not found" });
        }
        if (box.quantityAvailable < input.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Only ${box.quantityAvailable} boxes available`,
          });
        }

        // Decrement quantity atomically
        await decrementBoxQtyByAmount(input.boxId, input.quantity);

        // Verify decrement succeeded (race condition guard)
        const updatedBox = await getBoxById(input.boxId);
        if (!updatedBox) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const pin = generatePin();
        const qrToken = nanoid(32);
        const qrDataUrl = await generateQrDataUrl(qrToken);

        await createReservation({
          customerId: ctx.user.id,
          boxId: input.boxId,
          quantity: input.quantity,
          status: "active",
          pin,
          qrToken,
        });

        // Fetch the created reservation
        const customerReservations = await getReservationsByCustomerId(ctx.user.id);
        const newRes = customerReservations.find((r) => r.reservation.qrToken === qrToken);

        return {
          success: true,
          reservation: newRes?.reservation,
          pin,
          qrDataUrl,
        };
      }),
    cancel: protectedProcedure
      .input(z.object({ reservationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const reservation = await getReservationById(input.reservationId);
        if (!reservation) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (reservation.customerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        if (reservation.status !== "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only active reservations can be cancelled" });
        }

        await updateReservationStatus(input.reservationId, "cancelled");
        await incrementBoxQtyByAmount(reservation.boxId, reservation.quantity);

        return { success: true };
      }),
    getQr: protectedProcedure
      .input(z.object({ reservationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const reservation = await getReservationById(input.reservationId);
        if (!reservation) throw new TRPCError({ code: "NOT_FOUND" });
        if (reservation.customerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const qrDataUrl = await generateQrDataUrl(reservation.qrToken);
        return { pin: reservation.pin, qrDataUrl, status: reservation.status };
      }),
  }),
});

export type AppRouter = typeof appRouter;
