import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { SacredGeometryBackground } from "@/components/SacredGeometry";
import {
  Loader2,
  QrCode,
  KeyRound,
  CheckCircle2,
  User,
  Package,
  Camera,
  CameraOff,
  X,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

type RedeemResult = {
  success: boolean;
  reservation: { id: number; status: string };
  box: { title: string; price: string };
  customer: { name: string | null; email: string | null };
} | null;

function QrScanner({ onScan }: { onScan: (token: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerId = "qr-scanner-container";

  const startScanning = useCallback(async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        undefined
      );
      setScanning(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      setError(msg.includes("permission") || msg.includes("NotAllowed")
        ? "Camera permission denied. Please allow camera access."
        : "Could not start camera scanner.");
    }
  }, [onScan]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore stop errors
      }
    }
    setScanning(false);
  }, [scanning]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Scanner viewport */}
      <div
        className="rounded-xl overflow-hidden border-2"
        style={{
          borderColor: scanning ? "oklch(52% 0.18 140)" : "oklch(92% 0.01 140)",
          background: "oklch(10% 0.02 240)",
          minHeight: "260px",
          position: "relative",
        }}
      >
        <div id={containerId} style={{ width: "100%", minHeight: "260px" }} />
        {!scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "oklch(72% 0.14 75 / 0.15)" }}>
              <Camera className="w-6 h-6" style={{ color: "oklch(52% 0.18 140)" }} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Camera Scanner</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Point camera at customer's QR code
              </p>
            </div>
          </div>
        )}
        {scanning && (
          <div className="absolute top-2 right-2">
            <button
              onClick={stopScanning}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "oklch(18% 0.06 240 / 0.8)" }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-center px-3 py-2 rounded-lg"
          style={{ background: "oklch(58% 0.22 25 / 0.1)", color: "oklch(45% 0.22 25)", border: "1px solid oklch(58% 0.22 25 / 0.3)" }}>
          {error}
        </p>
      )}

      <Button
        className="w-full gap-2 font-semibold"
        onClick={scanning ? stopScanning : startScanning}
        style={
          scanning
            ? { background: "oklch(58% 0.22 25 / 0.15)", color: "oklch(45% 0.22 25)", border: "1px solid oklch(58% 0.22 25 / 0.3)" }
            : { background: "linear-gradient(135deg, oklch(52% 0.18 140), oklch(45% 0.16 140))", color: "white", border: "none" }
        }
      >
        {scanning ? (
          <><CameraOff className="w-4 h-4" /> Stop Camera</>
        ) : (
          <><Camera className="w-4 h-4" /> Start Camera</>
        )}
      </Button>
    </div>
  );
}

export default function RestaurantRedeem() {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [qrInput, setQrInput] = useState("");
  const [activeTab, setActiveTab] = useState<"pin" | "qr">("pin");
  const [result, setResult] = useState<RedeemResult>(null);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const redeemByPinMutation = trpc.restaurant.redeemByPin.useMutation({
    onSuccess: (data) => {
      setResult(data as RedeemResult);
      setPin(["", "", "", "", "", ""]);
      toast.success("Order marked as Picked Up!");
    },
    onError: (err) => {
      toast.error(err.message || "PIN not found or already redeemed");
    },
  });

  const redeemByQrMutation = trpc.restaurant.redeemByQr.useMutation({
    onSuccess: (data) => {
      setResult(data as RedeemResult);
      setQrInput("");
      toast.success("Order marked as Picked Up!");
    },
    onError: (err) => {
      toast.error(err.message || "QR token not found or already redeemed");
    },
  });

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setPin(pasted.split(""));
      pinRefs.current[5]?.focus();
    }
  };

  const handlePinSubmit = () => {
    const fullPin = pin.join("");
    if (fullPin.length !== 6) {
      toast.error("Please enter the full 6-digit PIN");
      return;
    }
    redeemByPinMutation.mutate({ pin: fullPin });
  };

  const handleQrScan = useCallback((token: string) => {
    redeemByQrMutation.mutate({ qrToken: token });
  }, [redeemByQrMutation]);

  const handleQrManualSubmit = () => {
    if (!qrInput.trim()) {
      toast.error("Please enter the QR token");
      return;
    }
    redeemByQrMutation.mutate({ qrToken: qrInput.trim() });
  };

  const isPinComplete = pin.every((d) => d !== "");

  return (
    <AppLayout>
      <SacredGeometryBackground />
      <div className="max-w-md mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(180deg, oklch(52% 0.18 140), oklch(45% 0.16 140))" }} />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(52% 0.18 140)" }}>
              Restaurant
            </p>
          </div>
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Redeem Order
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verify a customer's reservation to mark it as picked up.
          </p>
        </div>

        {/* Success Result */}
        {result && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: "oklch(65% 0.15 140 / 0.08)",
              border: "1.5px solid oklch(65% 0.15 140 / 0.35)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "oklch(65% 0.15 140 / 0.15)" }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: "oklch(35% 0.15 140)" }} />
              </div>
              <div>
                <p className="font-bold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>
                  Order Redeemed!
                </p>
                <p className="text-xs text-muted-foreground">Marked as Picked Up</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: "oklch(52% 0.18 140)" }} />
                <span className="font-medium text-foreground">{result.box.title}</span>
                <span className="text-muted-foreground">— ${parseFloat(result.box.price).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" style={{ color: "oklch(52% 0.18 140)" }} />
                <span className="text-foreground">{result.customer.name ?? "Customer"}</span>
                {result.customer.email && (
                  <span className="text-muted-foreground text-xs">({result.customer.email})</span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="mt-4 text-xs"
              onClick={() => setResult(null)}
            >
              Redeem Another
            </Button>
          </div>
        )}

        {/* Tab Switcher */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "oklch(96% 0.015 140)", border: "1px solid oklch(92% 0.01 140)" }}
        >
          {(["pin", "qr"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab ? "white" : "transparent",
                color: activeTab === tab ? "oklch(42% 0.14 65)" : "oklch(52% 0.03 240)",
                boxShadow: activeTab === tab ? "0 1px 4px oklch(18% 0.06 240 / 0.1)" : "none",
              }}
            >
              {tab === "pin" ? <KeyRound className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
              {tab === "pin" ? "Enter PIN" : "Scan QR"}
            </button>
          ))}
        </div>

        {/* PIN Tab */}
        {activeTab === "pin" && (
          <div
            className="rounded-2xl p-6"
            style={{
              background: "oklch(98.5% 0.012 85 / 0.92)",
              border: "1px solid oklch(72% 0.14 75 / 0.25)",
              boxShadow: "0 2px 16px oklch(72% 0.14 75 / 0.08)",
            }}
          >
            <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              6-Digit PIN
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ask the customer for their 6-digit PIN
            </p>

            <div className="flex justify-center gap-2 mb-6" onPaste={handlePinPaste}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { pinRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  className="w-11 h-14 text-center rounded-xl border-2 text-xl font-bold outline-none transition-all"
                  style={{
                    background: digit ? "oklch(60% 0.16 140 / 0.1)" : "oklch(96% 0.015 140)",
                    borderColor: digit ? "oklch(52% 0.18 140)" : "oklch(92% 0.01 140)",
                    color: "oklch(22% 0.04 240)",
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                />
              ))}
            </div>

            <Button
              className="w-full font-semibold"
              disabled={!isPinComplete || redeemByPinMutation.isPending}
              onClick={handlePinSubmit}
              style={{
                background: isPinComplete ? "linear-gradient(135deg, oklch(52% 0.18 140), oklch(45% 0.16 140))" : undefined,
                color: isPinComplete ? "white" : undefined,
                border: "none",
              }}
            >
              {redeemByPinMutation.isPending ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</span>
              ) : (
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Mark as Picked Up</span>
              )}
            </Button>
          </div>
        )}

        {/* QR Tab */}
        {activeTab === "qr" && (
          <div
            className="rounded-2xl p-6"
            style={{
              background: "oklch(98.5% 0.012 85 / 0.92)",
              border: "1px solid oklch(72% 0.14 75 / 0.25)",
              boxShadow: "0 2px 16px oklch(72% 0.14 75 / 0.08)",
            }}
          >
            <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              QR Code Scanner
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use your camera to scan the customer's QR code, or paste the token below
            </p>

            {/* Live camera scanner */}
            <div className="mb-5">
              <QrScanner onScan={handleQrScan} />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "oklch(72% 0.14 75 / 0.25)" }} />
              <span className="text-xs text-muted-foreground font-medium">or paste token</span>
              <div className="flex-1 h-px" style={{ background: "oklch(72% 0.14 75 / 0.25)" }} />
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Paste QR token here…"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="bg-white/60 font-mono text-sm"
              />
              <Button
                className="w-full font-semibold"
                disabled={!qrInput.trim() || redeemByQrMutation.isPending}
                onClick={handleQrManualSubmit}
                style={{
                  background: qrInput.trim() ? "linear-gradient(135deg, oklch(52% 0.18 140), oklch(45% 0.16 140))" : undefined,
                  color: qrInput.trim() ? "white" : undefined,
                  border: "none",
                }}
              >
                {redeemByQrMutation.isPending ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</span>
                ) : (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Mark as Picked Up</span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
