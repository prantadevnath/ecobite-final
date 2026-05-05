import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { SacredGeometryBackground } from "@/components/SacredGeometry";
import {
  Loader2,
  QrCode,
  X,
  Package,
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ReservationStatus = "active" | "picked_up" | "cancelled";

function StatusBadge({ status }: { status: ReservationStatus }) {
  const config = {
    active: { icon: Clock, label: "Active", bg: "oklch(72% 0.14 75 / 0.15)", color: "oklch(42% 0.14 65)", border: "oklch(72% 0.14 75 / 0.3)" },
    picked_up: { icon: CheckCircle2, label: "Picked Up", bg: "oklch(65% 0.15 140 / 0.15)", color: "oklch(35% 0.15 140)", border: "oklch(65% 0.15 140 / 0.3)" },
    cancelled: { icon: XCircle, label: "Cancelled", bg: "oklch(70% 0.05 240 / 0.15)", color: "oklch(45% 0.05 240)", border: "oklch(70% 0.05 240 / 0.3)" },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
      style={{ background: config.bg, color: config.color, borderColor: config.border }}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function QrModal({
  reservationId,
  onClose,
}: {
  reservationId: number;
  onClose: () => void;
}) {
  const { data, isLoading } = trpc.reservations.getQr.useQuery({ reservationId });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(18% 0.06 240 / 0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl p-6 relative"
        style={{
          background: "oklch(99% 0.002 0)",
          border: "1px solid oklch(72% 0.14 75 / 0.3)",
          boxShadow: "0 20px 60px oklch(18% 0.06 240 / 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <h3
          className="text-2xl font-bold text-foreground mb-1 text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Your Pass
        </h3>
        <p className="text-xs text-muted-foreground text-center mb-5">
          Show this to the restaurant
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(52% 0.18 140)" }} />
          </div>
        ) : data ? (
          <>
            {/* QR Code */}
            <div
              className="rounded-xl p-4 mb-5 flex items-center justify-center"
              style={{ background: "white", border: "1px solid oklch(72% 0.14 75 / 0.2)" }}
            >
              <img
                src={data.qrDataUrl}
                alt="Reservation QR Code"
                className="w-48 h-48"
              />
            </div>

            {/* Divider with "or" */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "oklch(72% 0.14 75 / 0.25)" }} />
              <span className="text-xs text-muted-foreground font-medium">or use PIN</span>
              <div className="flex-1 h-px" style={{ background: "oklch(72% 0.14 75 / 0.25)" }} />
            </div>

            {/* PIN Display */}
            <div className="flex justify-center gap-2 mb-4">
              {data.pin.split("").map((digit, i) => (
                <div
                  key={i}
                  className="w-10 h-12 flex items-center justify-center rounded-lg border-2"
                  style={{
                    background: "oklch(96% 0.015 140)",
                    borderColor: "oklch(72% 0.14 75 / 0.4)",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "oklch(22% 0.04 240)",
                  }}
                >
                  {digit}
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              6-digit PIN fallback for QR scanning issues
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function Reservations() {
  const { data: reservationsData, isLoading } = trpc.reservations.list.useQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [qrModalId, setQrModalId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const cancelMutation = trpc.reservations.cancel.useMutation({
    onSuccess: async () => {
      await utils.reservations.list.invalidate();
      await utils.boxes.listAvailable.invalidate();
      toast.success("Reservation cancelled. Quantity restored.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to cancel reservation");
    },
  });

  const activeReservations = reservationsData?.filter((r) => r.reservation.status === "active") ?? [];
  const pastReservations = reservationsData?.filter((r) => r.reservation.status !== "active") ?? [];

  return (
    <AppLayout>
      <SacredGeometryBackground />
      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-1 h-6 rounded-full"
              style={{ background: "linear-gradient(180deg, oklch(52% 0.18 140), oklch(45% 0.16 140))" }}
            />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(52% 0.18 140)" }}>
              My Account
            </p>
          </div>
          <h1
            className="text-4xl font-bold text-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            My Reservations
          </h1>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(52% 0.18 140)" }} />
          </div>
        )}

        {!isLoading && reservationsData?.length === 0 && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: "oklch(98.5% 0.012 85 / 0.8)",
              border: "1px solid oklch(72% 0.14 75 / 0.2)",
            }}
          >
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: "oklch(60% 0.16 140)" }} />
            <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              No Reservations Yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Browse available boxes and make your first reservation.
            </p>
          </div>
        )}

        {/* Active Reservations */}
        {activeReservations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "oklch(52% 0.18 140)" }}
              />
              Active ({activeReservations.length})
            </h2>
            <div className="space-y-3">
              {activeReservations.map(({ reservation, box, restaurant }) => (
                <div
                  key={reservation.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "oklch(98.5% 0.012 85 / 0.92)",
                    border: "1.5px solid oklch(72% 0.14 75 / 0.3)",
                    boxShadow: "0 2px 12px oklch(60% 0.16 140 / 0.1)",
                  }}
                >
                  <div className="h-1" style={{ background: "linear-gradient(90deg, oklch(52% 0.18 140), oklch(45% 0.16 140))" }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Store className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(52% 0.18 140)" }} />
                          <span className="text-xs" style={{ color: "oklch(52% 0.14 65)" }}>{restaurant.name}</span>
                        </div>
                        <h3 className="font-bold text-foreground text-lg leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                          {box.title}
                        </h3>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: "oklch(52% 0.14 65)" }}>
                          ${parseFloat(box.price).toFixed(2)}
                        </p>
                      </div>
                      <StatusBadge status={reservation.status} />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5 font-semibold text-xs"
                        onClick={() => setQrModalId(reservation.id)}
                        style={{
                          background: "linear-gradient(135deg, oklch(52% 0.18 140), oklch(45% 0.16 140))",
                          color: "white",
                          border: "none",
                        }}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Show QR / PIN
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate({ reservationId: reservation.id })}
                        style={{ borderColor: "oklch(58% 0.22 25 / 0.4)", color: "oklch(45% 0.22 25)" }}
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Past Reservations */}
        {pastReservations.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              History ({pastReservations.length})
            </h2>
            <div className="space-y-2">
              {pastReservations.map(({ reservation, box, restaurant }) => (
                <div
                  key={reservation.id}
                  className="rounded-xl p-4"
                  style={{
                    background: "oklch(98.5% 0.012 85 / 0.7)",
                    border: "1px solid oklch(92% 0.01 140)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{restaurant.name}</p>
                      <p className="font-semibold text-foreground text-sm truncate">{box.title}</p>
                    </div>
                    <StatusBadge status={reservation.status} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* QR Modal */}
      {qrModalId !== null && (
        <QrModal reservationId={qrModalId} onClose={() => setQrModalId(null)} />
      )}
    </AppLayout>
  );
}
