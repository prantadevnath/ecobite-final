import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Leaf, ShoppingBag, Store, Shield, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: user } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Signed out successfully");
      setLocation("/login");
    },
  });

  const navLinks = () => {
    if (!user) return [];
    if (user.role === "admin") {
      return [{ href: "/admin", label: "Dashboard", icon: Shield }];
    }
    if (user.role === "restaurant") {
      return [
        { href: "/restaurant", label: "My Boxes", icon: Store },
        { href: "/restaurant/redeem", label: "Redeem", icon: ShoppingBag },
      ];
    }
    return [
      { href: "/browse", label: "Browse Boxes", icon: ShoppingBag },
      { href: "/reservations", label: "My Reservations", icon: Leaf },
    ];
  };

  const links = navLinks();

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "oklch(98.5% 0.012 85 / 0.92)",
          borderColor: "oklch(72% 0.14 75 / 0.2)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href={user?.role === "admin" ? "/admin" : user?.role === "restaurant" ? "/restaurant" : "/browse"}>
            <div className="flex items-center gap-2 cursor-pointer">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, oklch(72% 0.14 75), oklch(58% 0.16 60))" }}
              >
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                EcoBite
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-sm font-medium"
                  style={{
                    color: location === href ? "oklch(52% 0.14 65)" : "oklch(40% 0.04 240)",
                    background: location === href ? "oklch(72% 0.14 75 / 0.12)" : "transparent",
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden sm:block text-xs text-muted-foreground max-w-[120px] truncate">
                {user.name}
              </span>
            )}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="gap-1.5 text-sm hidden sm:flex"
                style={{ color: "oklch(52% 0.03 240)" }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            ) : (
              <Link href="/login">
                <Button size="sm" style={{ background: "linear-gradient(135deg, oklch(72% 0.14 75), oklch(58% 0.16 60))", color: "white", border: "none" }}>
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="sm:hidden p-1.5 rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ color: "oklch(40% 0.04 240)" }}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="sm:hidden border-t px-4 py-3 space-y-1"
            style={{ borderColor: "oklch(72% 0.14 75 / 0.2)", background: "oklch(98.5% 0.012 85)" }}
          >
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    color: location === href ? "oklch(52% 0.14 65)" : "oklch(40% 0.04 240)",
                    background: location === href ? "oklch(72% 0.14 75 / 0.12)" : "transparent",
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              </Link>
            ))}
            {user && (
              <button
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ color: "oklch(52% 0.03 240)" }}
                onClick={() => { logoutMutation.mutate(); setMenuOpen(false); }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out ({user.name})
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-4 text-center text-xs text-muted-foreground"
        style={{ borderColor: "oklch(72% 0.14 75 / 0.2)" }}
      >
        © 2025 EcoBite — Rescue Food, Reduce Waste
      </footer>
    </div>
  );
}
