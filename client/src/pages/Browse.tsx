import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { SacredGeometryBackground } from "@/components/SacredGeometry";
import { ShoppingBag, Package, Store, Loader2, Leaf } from "lucide-react";

export default function Browse() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: boxesData, isLoading, refetch } = trpc.boxes.listAvailable.useQuery();
  const [reservingId, setReservingId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const reserveMutation = trpc.reservations.create.useMutation({
    onMutate: (vars) => {
      setReservingId(vars.boxId);
    },
    onSuccess: async (data) => {
      await utils.boxes.listAvailable.invalidate();
      await utils.reservations.list.invalidate();
      toast.success("Box reserved! Check your reservations for the QR code.");
      setLocation("/reservations");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reserve box");
    },
    onSettled: () => {
      setReservingId(null);
    },
  });

  const handleReserve = (boxId: number) => {
    if (!user) {
      toast.error("Please sign in to reserve a box");
      setLocation("/login");
      return;
    }
    if (user.role === "restaurant" || user.role === "admin") {
      toast.error("Only customers can reserve boxes");
      return;
    }
    reserveMutation.mutate({ boxId });
  };

  return (
    <AppLayout>
      <SacredGeometryBackground />
      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-1 h-6 rounded-full"
              style={{ background: "linear-gradient(180deg, oklch(52% 0.18 140), oklch(45% 0.16 140))" }}
            />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(52% 0.18 140)" }}>
              Today's Selection
            </p>
          </div>
          <h1
            className="text-4xl font-bold text-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Surprise Boxes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Reserve a mystery box from local restaurants and help reduce food waste.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(52% 0.18 140)" }} />
            <p className="text-sm text-muted-foreground">Loading available boxes…</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!boxesData || boxesData.length === 0) && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: "oklch(98.5% 0.012 85 / 0.8)",
              border: "1px solid oklch(72% 0.14 75 / 0.2)",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "oklch(72% 0.14 75 / 0.12)" }}
            >
              <Package className="w-8 h-8" style={{ color: "oklch(52% 0.18 140)" }} />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              No Boxes Available
            </h3>
            <p className="text-sm text-muted-foreground">
              Check back later — restaurants are preparing new surprise boxes.
            </p>
          </div>
        )}

        {/* Box Grid */}
        {!isLoading && boxesData && boxesData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {boxesData.map(({ box, restaurant }) => (
              <div
                key={box.id}
                className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "oklch(98.5% 0.012 85 / 0.92)",
                  border: "1px solid oklch(72% 0.14 75 / 0.22)",
                  boxShadow: "0 2px 16px oklch(72% 0.14 75 / 0.08), 0 1px 4px oklch(18% 0.06 240 / 0.06)",
                }}
              >
                {/* Card top accent */}
                <div
                  className="h-1.5 w-full"
                  style={{ background: "linear-gradient(90deg, oklch(52% 0.18 140), oklch(45% 0.16 140))" }}
                />

                <div className="p-5 flex flex-col flex-1">
                  {/* Restaurant badge */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <Store className="w-3.5 h-3.5" style={{ color: "oklch(52% 0.18 140)" }} />
                    <span className="text-xs font-medium" style={{ color: "oklch(52% 0.14 65)" }}>
                      {restaurant.name}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-xl font-bold text-foreground mb-1.5 leading-tight"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {box.title}
                  </h3>

                  {/* Description */}
                  {box.description && (
                    <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed line-clamp-2">
                      {box.description}
                    </p>
                  )}

                  {/* Price + Quantity row */}
                  <div className="flex items-end justify-between mt-auto pt-3 border-t" style={{ borderColor: "oklch(72% 0.14 75 / 0.15)" }}>
                    <div>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: "oklch(52% 0.14 65)", fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        ${parseFloat(box.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {box.quantityAvailable} left
                      </span>
                    </div>
                  </div>

                  {/* Reserve button */}
                  <Button
                    className="w-full mt-3 font-semibold text-sm"
                    disabled={box.quantityAvailable <= 0 || reservingId === box.id}
                    onClick={() => handleReserve(box.id)}
                    style={
                      box.quantityAvailable > 0
                        ? {
                            background: "linear-gradient(135deg, oklch(52% 0.18 140), oklch(45% 0.16 140))",
                            color: "white",
                            border: "none",
                          }
                        : {}
                    }
                  >
                    {reservingId === box.id ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Reserving…
                      </span>
                    ) : box.quantityAvailable <= 0 ? (
                      "Sold Out"
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Reserve Box
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh hint */}
        {!isLoading && boxesData && boxesData.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => refetch()}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Leaf className="w-3 h-3 inline mr-1" />
              Refresh availability
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
