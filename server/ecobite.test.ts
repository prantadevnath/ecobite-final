import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB module ───────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUserById: vi.fn(),
  getAllUsers: vi.fn(),
  upsertUser: vi.fn(),
  createRestaurant: vi.fn(),
  getRestaurantByUserId: vi.fn(),
  getRestaurantById: vi.fn(),
  getAllRestaurants: vi.fn(),
  approveRestaurant: vi.fn(),
  rejectRestaurant: vi.fn(),
  createBox: vi.fn(),
  updateBox: vi.fn(),
  softDeleteBox: vi.fn(),
  getBoxesByRestaurantId: vi.fn(),
  getBoxById: vi.fn(),
  getAvailableBoxes: vi.fn(),
  decrementBoxQty: vi.fn(),
  incrementBoxQty: vi.fn(),
  decrementBoxQtyByAmount: vi.fn(),
  incrementBoxQtyByAmount: vi.fn(),
  createReservation: vi.fn(),
  getReservationsByCustomerId: vi.fn(),
  getReservationById: vi.fn(),
  getReservationByPin: vi.fn(),
  getReservationByQrToken: vi.fn(),
  updateReservationStatus: vi.fn(),
  getReservationsByRestaurantId: vi.fn(),
}));

// ─── Mock bcryptjs ────────────────────────────────────────────────────────────
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// ─── Mock qrcode ──────────────────────────────────────────────────────────────
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
  },
}));

// ─── Mock nanoid ──────────────────────────────────────────────────────────────
vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("mock_nanoid_token"),
}));

// ─── Mock sdk ─────────────────────────────────────────────────────────────────
vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockReturnValue("mock_session_token"),
  },
}));

// ─── Mock shared/const ────────────────────────────────────────────────────────
vi.mock("@shared/const", () => ({
  COOKIE_NAME: "app_session_id",
  ONE_YEAR_MS: 31536000000,
}));

// ─── Mock cookies ─────────────────────────────────────────────────────────────
vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  }),
}));

// ─── Mock systemRouter ────────────────────────────────────────────────────────
vi.mock("./_core/systemRouter", () => ({
  systemRouter: {},
}));

import { appRouter } from "./routers";
import * as db from "./db";

// ─── Context helpers ─────────────────────────────────────────────────────────

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createCustomerCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "customer_openid",
      email: "customer@test.com",
      name: "Test Customer",
      loginMethod: "email",
      role: "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: "hashed",
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn(), setHeader: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createRestaurantCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "restaurant_openid",
      email: "restaurant@test.com",
      name: "Test Restaurant Owner",
      loginMethod: "email",
      role: "restaurant",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: "hashed",
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 99,
      openId: "admin_openid",
      email: "admin@test.com",
      name: "Admin User",
      loginMethod: "email",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      passwordHash: "hashed",
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth.signup", () => {
  it("creates a customer account and sets session cookie", async () => {
    const ctx = createPublicCtx();
    vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
    vi.mocked(db.upsertUser).mockResolvedValue(undefined);
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined).mockResolvedValueOnce({
      id: 1,
      openId: "email_mock_nanoid_token",
      email: "new@test.com",
      name: "New User",
      role: "customer",
      loginMethod: "email",
      passwordHash: "hashed",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.signup({
      name: "New User",
      email: "new@test.com",
      password: "password123",
      role: "customer",
    });

    expect(result.success).toBe(true);
    expect(result.user.role).toBe("customer");
    expect(ctx.res.setHeader).toHaveBeenCalled();
    const calls = (ctx.res.setHeader as any).mock.calls;
    expect(calls[0]?.[0]).toBe("Set-Cookie");
    expect(calls[0]?.[1]).toContain("app_session_id=mock_session_token");
  });

  it("throws CONFLICT if email already exists", async () => {
    const ctx = createPublicCtx();
    vi.mocked(db.getUserByEmail).mockResolvedValue({
      id: 1,
      openId: "existing",
      email: "existing@test.com",
      name: "Existing",
      role: "customer",
      loginMethod: "email",
      passwordHash: "hashed",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.signup({ name: "ExistingUser", email: "existing@test.com", password: "pass123", role: "customer" })
    ).rejects.toThrow("Email already registered");
  });
});

describe("auth.login", () => {
  it("logs in with correct credentials", async () => {
    const ctx = createPublicCtx();
    vi.mocked(db.getUserByEmail).mockResolvedValue({
      id: 1,
      openId: "user_openid",
      email: "user@test.com",
      name: "User",
      role: "customer",
      loginMethod: "email",
      passwordHash: "hashed_password",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.login({ email: "user@test.com", password: "correct" });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("user@test.com");
    expect(ctx.res.setHeader).toHaveBeenCalled();
    const calls = (ctx.res.setHeader as any).mock.calls;
    expect(calls[0]?.[0]).toBe("Set-Cookie");
    expect(calls[0]?.[1]).toContain("app_session_id=mock_session_token");
  });

  it("throws UNAUTHORIZED for wrong password", async () => {
    const ctx = createPublicCtx();
    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as never);
    vi.mocked(db.getUserByEmail).mockResolvedValue({
      id: 1,
      openId: "user_openid",
      email: "user@test.com",
      name: "User",
      role: "customer",
      loginMethod: "email",
      passwordHash: "hashed_password",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.login({ email: "user@test.com", password: "wrong" })
    ).rejects.toThrow("Invalid credentials");
  });
});

describe("reservations.create", () => {
  it("decrements box quantity and creates reservation", async () => {
    const ctx = createCustomerCtx();
    vi.mocked(db.getBoxById)
      .mockResolvedValueOnce({
        id: 10,
        restaurantId: 1,
        title: "Mystery Box",
        description: "Surprise!",
        normalPrice: "19.99",
        discountedPrice: "10.00",
        quantityAvailable: 3,
        pickupTimeStart: null,
        pickupTimeEnd: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: 10,
        restaurantId: 1,
        title: "Mystery Box",
        description: "Surprise!",
        normalPrice: "19.99",
        discountedPrice: "10.00",
        quantityAvailable: 2, // decremented
        pickupTimeStart: null,
        pickupTimeEnd: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    vi.mocked(db.decrementBoxQty).mockResolvedValue(undefined);
    vi.mocked(db.createReservation).mockResolvedValue({} as never);
    vi.mocked(db.getReservationsByCustomerId).mockResolvedValue([
      {
        reservation: {
          id: 1,
          customerId: 1,
          boxId: 10,
          status: "active",
          pin: "123456",
          qrToken: "mock_nanoid_token",
          createdAt: new Date(),
          updatedAt: new Date(),
          quantity: 0
        },
        box: { id: 10, restaurantId: 1, title: "Mystery Box", description: null, normalPrice: "19.99", discountedPrice: "10.00", quantityAvailable: 2, pickupTimeStart: null, pickupTimeEnd: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        restaurant: { id: 1, userId: 2, name: "Test Restaurant", description: null, status: "approved", createdAt: new Date(), updatedAt: new Date() },
      },
    ]);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.reservations.create({ boxId: 10, quantity: 1 });

    expect(result.success).toBe(true);
    expect(db.decrementBoxQtyByAmount).toHaveBeenCalledWith(10, 1);
    expect(db.createReservation).toHaveBeenCalled();
    expect(result.pin).toHaveLength(6);
  });

  it("reserves multiple boxes and decrements by quantity", async () => {
    const ctx = createCustomerCtx();
    vi.mocked(db.getBoxById).mockResolvedValue({
      id: 10,
      restaurantId: 1,
      title: "Mystery Box",
      description: null,
      normalPrice: "19.99",
      discountedPrice: "10.00",
      quantityAvailable: 5,
      pickupTimeStart: null,
      pickupTimeEnd: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.decrementBoxQtyByAmount).mockResolvedValue(undefined);
    vi.mocked(db.createReservation).mockResolvedValue({} as never);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.reservations.create({ boxId: 10, quantity: 3 });

    expect(result.success).toBe(true);
    expect(db.decrementBoxQtyByAmount).toHaveBeenCalledWith(10, 3);
    expect(db.createReservation).toHaveBeenCalled();
    expect(result.pin).toHaveLength(6);
  });

  it("throws BAD_REQUEST when box is sold out", async () => {
    const ctx = createCustomerCtx();
    vi.mocked(db.getBoxById).mockResolvedValue({
      id: 10,
      restaurantId: 1,
      title: "Mystery Box",
      description: null,
      normalPrice: "19.99",
      discountedPrice: "9.99",
      quantityAvailable: 0,
      pickupTimeStart: null,
      pickupTimeEnd: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    await expect(caller.reservations.create({ boxId: 10, quantity: 1 })).rejects.toThrow("Only 0 boxes available");
  });

  it("throws BAD_REQUEST when requesting more boxes than available", async () => {
    const ctx = createCustomerCtx();
    vi.mocked(db.getBoxById).mockResolvedValue({
      id: 10,
      restaurantId: 1,
      title: "Mystery Box",
      description: null,
      normalPrice: "19.99",
      discountedPrice: "9.99",
      quantityAvailable: 2,
      pickupTimeStart: null,
      pickupTimeEnd: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    await expect(caller.reservations.create({ boxId: 10, quantity: 5 })).rejects.toThrow("Only 2 boxes available");
  });
});

describe("reservations.cancel", () => {
  it("cancels reservation and increments box quantity", async () => {
    const ctx = createCustomerCtx();
    vi.mocked(db.getReservationById).mockResolvedValue({
      id: 1,
      customerId: 1, // matches ctx.user.id
      boxId: 10,
      quantity: 1,
      status: "active",
      pin: "123456",
      qrToken: "token123",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.updateReservationStatus).mockResolvedValue(undefined);
    vi.mocked(db.incrementBoxQtyByAmount).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.reservations.cancel({ reservationId: 1 });

    expect(result.success).toBe(true);
    expect(db.updateReservationStatus).toHaveBeenCalledWith(1, "cancelled");
    expect(db.incrementBoxQtyByAmount).toHaveBeenCalledWith(10, 1);
  });

  it("throws FORBIDDEN when cancelling another user's reservation", async () => {
    const ctx = createCustomerCtx();
    vi.mocked(db.getReservationById).mockResolvedValue({
      id: 2,
      customerId: 999, // different user
      boxId: 10,
      quantity: 1,
      status: "active",
      pin: "654321",
      qrToken: "token456",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    await expect(caller.reservations.cancel({ reservationId: 2 })).rejects.toThrow("FORBIDDEN");
  });
});

describe("admin.approveRestaurant", () => {
  it("approves a restaurant", async () => {
    const ctx = createAdminCtx();
    vi.mocked(db.approveRestaurant).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.approveRestaurant({ restaurantId: 5 });

    expect(result.success).toBe(true);
    expect(db.approveRestaurant).toHaveBeenCalledWith(5);
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const ctx = createCustomerCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.approveRestaurant({ restaurantId: 5 })).rejects.toThrow();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie", async () => {
    const ctx = createCustomerCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalledWith(
      "app_session_id",
      expect.objectContaining({ maxAge: -1 })
    );
  });
});
