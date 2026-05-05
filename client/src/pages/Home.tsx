import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { SacredGeometryBackground } from "@/components/SacredGeometry";
import { Leaf, ShoppingBag, Store, Shield, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") setLocation("/admin");
      else if (user.role === "restaurant") setLocation("/restaurant");
      else setLocation("/browse");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(62% 0.14 65)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <SacredGeometryBackground />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, oklch(72% 0.14 75), oklch(58% 0.16 60))" }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            EcoBite
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sm font-medium" style={{ color: "oklch(40% 0.04 240)" }}>
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, oklch(72% 0.14 75), oklch(58% 0.16 60))", color: "white", border: "none" }}
            >
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "oklch(72% 0.14 75 / 0.12)", color: "oklch(42% 0.14 65)", border: "1px solid oklch(72% 0.14 75 / 0.3)" }}>
          <Leaf className="w-3 h-3" />
          Rescue Food · Reduce Waste
        </div>

        <h1
          className="text-5xl sm:text-7xl font-bold text-foreground mb-4 leading-tight max-w-3xl"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Surprise Boxes,
          <br />
          <span style={{ color: "oklch(52% 0.14 65)" }}>Rescued Food.</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
          Reserve mystery food boxes from local restaurants at a fraction of the cost.
          Help reduce waste while discovering new flavors.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/signup">
            <Button
              size="lg"
              className="gap-2 font-semibold px-8"
              style={{ background: "linear-gradient(135deg, oklch(72% 0.14 75), oklch(58% 0.16 60))", color: "white", border: "none" }}
            >
              <ShoppingBag className="w-5 h-5" />
              Browse Boxes
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 font-semibold px-8"
              style={{ borderColor: "oklch(72% 0.14 75 / 0.4)", color: "oklch(42% 0.14 65)", background: "oklch(98.5% 0.012 85 / 0.7)" }}
            >
              <Store className="w-5 h-5" />
              List Your Restaurant
            </Button>
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-3xl w-full">
          {[
            {
              icon: ShoppingBag,
              title: "For Customers",
              desc: "Browse surprise boxes, reserve with one tap, and pick up with a QR code or PIN.",
            },
            {
              icon: Store,
              title: "For Restaurants",
              desc: "List your surplus food as mystery boxes. Manage inventory and redeem orders instantly.",
            },
            {
              icon: Shield,
              title: "Trusted Platform",
              desc: "Admin-verified restaurants. Real-time quantity tracking. Secure reservations.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-5 text-left"
              style={{
                background: "oklch(98.5% 0.012 85 / 0.85)",
                border: "1px solid oklch(72% 0.14 75 / 0.2)",
                boxShadow: "0 2px 12px oklch(72% 0.14 75 / 0.07)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "oklch(72% 0.14 75 / 0.15)" }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color: "oklch(52% 0.14 65)" }} />
              </div>
              <h3 className="font-bold text-foreground mb-1.5" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 text-xs text-muted-foreground border-t"
        style={{ borderColor: "oklch(72% 0.14 75 / 0.2)" }}>
        © 2025 EcoBite — Rescue Food, Reduce Waste
      </footer>
    </div>
  );
}
