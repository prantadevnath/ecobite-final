import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { SacredGeometryBackground } from "@/components/SacredGeometry";
import {
  Loader2,
  Users,
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ShoppingBag,
} from "lucide-react";

type TabType = "restaurants" | "users";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("restaurants");

  const { data: users, isLoading: usersLoading } = trpc.admin.listUsers.useQuery();
  const { data: restaurants, isLoading: restaurantsLoading } = trpc.admin.listRestaurants.useQuery();

  const utils = trpc.useUtils();

  const approveMutation = trpc.admin.approveRestaurant.useMutation({
    onSuccess: async () => {
      await utils.admin.listRestaurants.invalidate();
      toast.success("Restaurant approved!");
    },
    onError: (err) => toast.error(err.message || "Failed to approve"),
  });

  const rejectMutation = trpc.admin.rejectRestaurant.useMutation({
    onSuccess: async () => {
      await utils.admin.listRestaurants.invalidate();
      toast.success("Restaurant rejected.");
    },
    onError: (err) => toast.error(err.message || "Failed to reject"),
  });

  const pendingCount = restaurants?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <AppLayout>
      <SacredGeometryBackground />
      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(180deg, oklch(60% 0.16 140), oklch(58% 0.16 60))" }} />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(52% 0.18 140)" }}>
              Administration
            </p>
          </div>
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, approve restaurants, and oversee the platform.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total Users", value: users?.length ?? "—", icon: Users, color: "oklch(55% 0.12 200)" },
            { label: "Restaurants", value: restaurants?.length ?? "—", icon: Store, color: "oklch(52% 0.18 140)" },
            { label: "Pending Approval", value: pendingCount, icon: Clock, color: "oklch(65% 0.18 50)" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 text-center"
              style={{
                background: "oklch(98.5% 0.012 85 / 0.92)",
                border: "1px solid oklch(72% 0.14 75 / 0.2)",
              }}
            >
              <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color }} />
              <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tab Switcher */}
        <div
          className="flex rounded-xl p-1 mb-6 w-fit"
          style={{ background: "oklch(94% 0.025 85)", border: "1px solid oklch(88% 0.03 85)" }}
        >
          {(["restaurants", "users"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab ? "white" : "transparent",
                color: activeTab === tab ? "oklch(42% 0.14 65)" : "oklch(52% 0.03 240)",
                boxShadow: activeTab === tab ? "0 1px 4px oklch(18% 0.06 240 / 0.1)" : "none",
              }}
            >
              {tab === "restaurants" ? <Store className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              {tab === "restaurants" ? (
                <span>
                  Restaurants
                  {pendingCount > 0 && (
                    <span
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
                      style={{ background: "oklch(52% 0.18 140)", color: "white", fontSize: "0.6rem" }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </span>
              ) : "Users"}
            </button>
          ))}
        </div>

        {/* Restaurants Tab */}
        {activeTab === "restaurants" && (
          <div>
            {restaurantsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(52% 0.18 140)" }} />
              </div>
            ) : !restaurants || restaurants.length === 0 ? (
              <div className="rounded-2xl p-12 text-center"
                style={{ background: "oklch(98.5% 0.012 85 / 0.8)", border: "1px solid oklch(72% 0.14 75 / 0.2)" }}>
                <Store className="w-12 h-12 mx-auto mb-3" style={{ color: "oklch(60% 0.16 140)" }} />
                <p className="text-lg font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>No restaurants yet</p>
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "oklch(98.5% 0.012 85 / 0.92)",
                  border: "1px solid oklch(72% 0.14 75 / 0.2)",
                  boxShadow: "0 2px 16px oklch(72% 0.14 75 / 0.08)",
                }}
              >
                {/* Table header */}
                <div
                  className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-widest"
                  style={{ borderBottom: "1px solid oklch(72% 0.14 75 / 0.15)", color: "oklch(52% 0.14 65)" }}
                >
                  <div className="col-span-4">Restaurant</div>
                  <div className="col-span-3 hidden sm:block">Owner</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>

                {/* Table rows */}
                {restaurants.map((restaurant, i) => (
                  <div
                    key={restaurant.id}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center"
                    style={{
                      borderBottom: i < restaurants.length - 1 ? "1px solid oklch(88% 0.03 85)" : "none",
                    }}
                  >
                    <div className="col-span-4">
                      <p className="font-semibold text-foreground text-sm">{restaurant.name}</p>
                      {restaurant.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{restaurant.description}</p>
                      )}
                    </div>
                    <div className="col-span-3 hidden sm:block">
                      <p className="text-sm text-foreground">{restaurant.ownerName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{restaurant.ownerEmail ?? ""}</p>
                    </div>
                    <div className="col-span-2">
                      {restaurant.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
                          style={{ background: "oklch(72% 0.14 75 / 0.1)", color: "oklch(52% 0.14 65)", borderColor: "oklch(72% 0.14 75 / 0.3)" }}>
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                      {restaurant.status === "approved" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
                          style={{ background: "oklch(65% 0.15 140 / 0.1)", color: "oklch(35% 0.15 140)", borderColor: "oklch(65% 0.15 140 / 0.3)" }}>
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {restaurant.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
                          style={{ background: "oklch(58% 0.22 25 / 0.1)", color: "oklch(45% 0.22 25)", borderColor: "oklch(58% 0.22 25 / 0.3)" }}>
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 flex justify-end gap-1.5">
                      {restaurant.status !== "approved" && (
                        <Button
                          size="sm"
                          className="text-xs h-7 px-2.5 font-semibold"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate({ restaurantId: restaurant.id })}
                          style={{ background: "linear-gradient(135deg, oklch(65% 0.15 140), oklch(50% 0.15 140))", color: "white", border: "none" }}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                      )}
                      {restaurant.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2.5"
                          disabled={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate({ restaurantId: restaurant.id })}
                          style={{ borderColor: "oklch(58% 0.22 25 / 0.4)", color: "oklch(45% 0.22 25)" }}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            {usersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(52% 0.18 140)" }} />
              </div>
            ) : !users || users.length === 0 ? (
              <div className="rounded-2xl p-12 text-center"
                style={{ background: "oklch(98.5% 0.012 85 / 0.8)", border: "1px solid oklch(72% 0.14 75 / 0.2)" }}>
                <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "oklch(60% 0.16 140)" }} />
                <p className="text-lg font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>No users yet</p>
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "oklch(98.5% 0.012 85 / 0.92)",
                  border: "1px solid oklch(72% 0.14 75 / 0.2)",
                  boxShadow: "0 2px 16px oklch(72% 0.14 75 / 0.08)",
                }}
              >
                <div
                  className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-widest"
                  style={{ borderBottom: "1px solid oklch(72% 0.14 75 / 0.15)", color: "oklch(52% 0.14 65)" }}
                >
                  <div className="col-span-4">Name</div>
                  <div className="col-span-4">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Joined</div>
                </div>

                {users.map((user, i) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center"
                    style={{ borderBottom: i < users.length - 1 ? "1px solid oklch(88% 0.03 85)" : "none" }}
                  >
                    <div className="col-span-4">
                      <p className="text-sm font-medium text-foreground">{user.name ?? "—"}</p>
                    </div>
                    <div className="col-span-4">
                      <p className="text-sm text-muted-foreground truncate">{user.email ?? "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
                        style={
                          user.role === "admin"
                            ? { background: "oklch(55% 0.12 200 / 0.1)", color: "oklch(35% 0.12 200)", borderColor: "oklch(55% 0.12 200 / 0.3)" }
                            : user.role === "restaurant"
                            ? { background: "oklch(72% 0.14 75 / 0.1)", color: "oklch(42% 0.14 65)", borderColor: "oklch(72% 0.14 75 / 0.3)" }
                            : { background: "oklch(70% 0.05 240 / 0.1)", color: "oklch(45% 0.05 240)", borderColor: "oklch(70% 0.05 240 / 0.3)" }
                        }
                      >
                        {user.role === "admin" ? <Shield className="w-3 h-3" /> : user.role === "restaurant" ? <Store className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
