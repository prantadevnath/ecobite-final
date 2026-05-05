import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SacredGeometryBackground } from "@/components/SacredGeometry";
import { Leaf, ShoppingBag, Store } from "lucide-react";

type Role = "customer" | "restaurant";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<Role>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantDescription, setRestaurantDescription] = useState("");

  const utils = trpc.useUtils();

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: async (data) => {
      await utils.auth.me.invalidate();
      toast.success("Account created! Welcome to EcoBite.");
      const r = data.user.role;
      if (r === "admin") setLocation("/admin");
      else if (r === "restaurant") setLocation("/restaurant");
      else setLocation("/browse");
    },
    onError: (err) => {
      toast.error(err.message || "Signup failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (role === "restaurant" && !restaurantName) {
      toast.error("Please enter your restaurant name");
      return;
    }
    signupMutation.mutate({
      name,
      email,
      password,
      role,
      restaurantName: role === "restaurant" ? restaurantName : undefined,
      restaurantDescription: role === "restaurant" ? restaurantDescription : undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8">
      <SacredGeometryBackground />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
            style={{ background: "linear-gradient(135deg, oklch(72% 0.14 75), oklch(60% 0.16 60))" }}>
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Join EcoBite
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(62% 0.14 65)" }}>
            Create your account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 shadow-lg"
          style={{
            background: "oklch(98.5% 0.012 85 / 0.92)",
            border: "1px solid oklch(72% 0.14 75 / 0.25)",
            backdropFilter: "blur(12px)",
          }}>

          {/* Role Selector */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">I am a…</p>
            <div className="grid grid-cols-2 gap-2">
              {(["customer", "restaurant"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium"
                  style={{
                    borderColor: role === r ? "oklch(62% 0.14 65)" : "oklch(88% 0.03 85)",
                    background: role === r ? "oklch(72% 0.14 75 / 0.12)" : "transparent",
                    color: role === r ? "oklch(42% 0.14 65)" : "oklch(52% 0.03 240)",
                  }}
                >
                  {r === "customer" ? <ShoppingBag className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                  {r === "customer" ? "Customer" : "Restaurant"}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/60"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/60"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/60"
                required
                minLength={6}
              />
            </div>

            {role === "restaurant" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="restaurantName" className="text-sm font-medium">Restaurant Name</Label>
                  <Input
                    id="restaurantName"
                    type="text"
                    placeholder="Your restaurant's name"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="bg-white/60"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="restaurantDesc" className="text-sm font-medium">
                    Description <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="restaurantDesc"
                    type="text"
                    placeholder="Brief description of your restaurant"
                    value={restaurantDescription}
                    onChange={(e) => setRestaurantDescription(e.target.value)}
                    className="bg-white/60"
                  />
                </div>
                <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⏳ Restaurant accounts require admin approval before you can list boxes.
                </p>
              </>
            )}

            <Button
              type="submit"
              className="w-full font-semibold text-sm tracking-wide mt-1"
              disabled={signupMutation.isPending}
              style={{
                background: "linear-gradient(135deg, oklch(72% 0.14 75), oklch(58% 0.16 60))",
                color: "white",
                border: "none",
              }}
            >
              {signupMutation.isPending ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "oklch(72% 0.14 75 / 0.25)" }} />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px" style={{ background: "oklch(72% 0.14 75 / 0.25)" }} />
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "oklch(52% 0.14 65)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
