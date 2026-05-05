import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SacredGeometryBackground } from "@/components/SacredGeometry";
import { Leaf } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      console.log("[Login] Success, data:", data);
      await utils.auth.me.invalidate();
      toast.success(`Welcome back, ${data.user.name ?? "friend"}!`);
      const role = data.user.role;
      console.log("[Login] User role:", role);
      // Use setTimeout to ensure the toast is shown before redirect
      setTimeout(() => {
        if (role === "admin") {
          console.log("[Login] Redirecting to /admin");
          setLocation("/admin");
        } else if (role === "restaurant") {
          console.log("[Login] Redirecting to /restaurant");
          setLocation("/restaurant");
        } else {
          console.log("[Login] Redirecting to /browse");
          setLocation("/browse");
        }
      }, 500);
    },
    onError: (err) => {
      console.error("[Login] Error:", err);
      toast.error(err.message || "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    console.log("[Login] Attempting login with email:", email);
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <SacredGeometryBackground />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/manus-storage/ecobite-logo_9f663873.png"
            alt="EcoBite Logo"
            className="w-16 h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            EcoBite
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(52% 0.18 140)" }}>
            Rescue Food. Reduce Waste.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-lg"
          style={{
            background: "oklch(99% 0.002 0 / 0.92)",
            border: "1px solid oklch(92% 0.01 140 / 0.25)",
            backdropFilter: "blur(12px)",
          }}>
          <h2 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Welcome Back
          </h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/60 border-border focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/60 border-border focus:border-primary"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full font-semibold text-sm tracking-wide"
              disabled={loginMutation.isPending}
              style={{
                background: "linear-gradient(135deg, oklch(52% 0.18 140), oklch(45% 0.16 140))",
                color: "white",
                border: "none",
              }}
              onClick={() => console.log("[Login] Sign In button clicked")}
            >
              {loginMutation.isPending ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "oklch(72% 0.14 75 / 0.25)" }} />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px" style={{ background: "oklch(72% 0.14 75 / 0.25)" }} />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold" style={{ color: "oklch(52% 0.14 65)" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
