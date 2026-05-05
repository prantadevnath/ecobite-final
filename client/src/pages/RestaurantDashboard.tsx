import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { SacredGeometryBackground } from "@/components/SacredGeometry";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Package,
  X,
  Check,
  Clock,
  AlertCircle,
} from "lucide-react";

interface BoxFormData {
  title: string;
  description: string;
  price: string;
  quantityAvailable: number;
}

const emptyForm: BoxFormData = { title: "", description: "", price: "", quantityAvailable: 1 };

export default function RestaurantDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BoxFormData>(emptyForm);

  const { data: profile, isLoading: profileLoading } = trpc.restaurant.getProfile.useQuery();
  const { data: boxes, isLoading: boxesLoading } = trpc.restaurant.listBoxes.useQuery();

  const utils = trpc.useUtils();

  const createMutation = trpc.restaurant.createBox.useMutation({
    onSuccess: async () => {
      await utils.restaurant.listBoxes.invalidate();
      toast.success("Surprise Box created!");
      setForm(emptyForm);
      setShowForm(false);
    },
    onError: (err) => toast.error(err.message || "Failed to create box"),
  });

  const updateMutation = trpc.restaurant.updateBox.useMutation({
    onSuccess: async () => {
      await utils.restaurant.listBoxes.invalidate();
      toast.success("Box updated!");
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.message || "Failed to update box"),
  });

  const deleteMutation = trpc.restaurant.deleteBox.useMutation({
    onSuccess: async () => {
      await utils.restaurant.listBoxes.invalidate();
      toast.success("Box removed.");
    },
    onError: (err) => toast.error(err.message || "Failed to delete box"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price) {
      toast.error("Title and price are required");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(form.price)) {
      toast.error("Price must be a valid number (e.g. 9.99)");
      return;
    }
    if (editingId !== null) {
      updateMutation.mutate({ boxId: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const startEdit = (box: NonNullable<typeof boxes>[0]) => {
    setEditingId(box.id);
    setForm({
      title: box.title,
      description: box.description ?? "",
      price: box.price,
      quantityAvailable: box.quantityAvailable,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const isPending = profile?.status === "pending";
  const isRejected = profile?.status === "rejected";

  return (
    <AppLayout>
      <SacredGeometryBackground />
      <div className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(180deg, oklch(72% 0.14 75), oklch(58% 0.16 60))" }} />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(62% 0.14 65)" }}>
              Restaurant
            </p>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {profileLoading ? "Loading…" : profile?.name ?? "My Dashboard"}
              </h1>
              {profile && (
                <div className="flex items-center gap-1.5 mt-1">
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                      style={{ background: "oklch(72% 0.14 75 / 0.1)", color: "oklch(52% 0.14 65)", borderColor: "oklch(72% 0.14 75 / 0.3)" }}>
                      <Clock className="w-3 h-3" /> Pending Approval
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                      style={{ background: "oklch(58% 0.22 25 / 0.1)", color: "oklch(45% 0.22 25)", borderColor: "oklch(58% 0.22 25 / 0.3)" }}>
                      <AlertCircle className="w-3 h-3" /> Not Approved
                    </span>
                  )}
                  {!isPending && !isRejected && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                      style={{ background: "oklch(65% 0.15 140 / 0.1)", color: "oklch(35% 0.15 140)", borderColor: "oklch(65% 0.15 140 / 0.3)" }}>
                      <Check className="w-3 h-3" /> Approved
                    </span>
                  )}
                </div>
              )}
            </div>
            {!isPending && !isRejected && (
              <Button
                size="sm"
                onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
                className="gap-1.5 font-semibold text-sm flex-shrink-0"
                style={{ background: "linear-gradient(135deg, oklch(72% 0.14 75), oklch(58% 0.16 60))", color: "white", border: "none" }}
              >
                <Plus className="w-4 h-4" />
                New Box
              </Button>
            )}
          </div>
        </div>

        {/* Pending notice */}
        {isPending && (
          <div className="rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ background: "oklch(72% 0.14 75 / 0.08)", border: "1px solid oklch(72% 0.14 75 / 0.25)" }}>
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "oklch(62% 0.14 65)" }} />
            <div>
              <p className="text-sm font-semibold text-foreground">Awaiting Admin Approval</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your restaurant is under review. You'll be able to create boxes once approved.
              </p>
            </div>
          </div>
        )}

        {/* Box Form */}
        {showForm && (
          <div className="rounded-2xl p-6 mb-6"
            style={{
              background: "oklch(98.5% 0.012 85 / 0.95)",
              border: "1.5px solid oklch(72% 0.14 75 / 0.3)",
              boxShadow: "0 4px 20px oklch(72% 0.14 75 / 0.12)",
            }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {editingId ? "Edit Box" : "New Surprise Box"}
              </h2>
              <button onClick={cancelForm} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Chef's Mystery Box"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="bg-white/60"
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="desc" className="text-sm font-medium">Description</Label>
                  <Input
                    id="desc"
                    placeholder="What's inside? (optional)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-white/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-sm font-medium">Price ($) *</Label>
                  <Input
                    id="price"
                    placeholder="9.99"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="bg-white/60"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qty" className="text-sm font-medium">Quantity Available *</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={0}
                    placeholder="5"
                    value={form.quantityAvailable}
                    onChange={(e) => setForm({ ...form, quantityAvailable: parseInt(e.target.value) || 0 })}
                    className="bg-white/60"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 font-semibold text-sm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{ background: "linear-gradient(135deg, oklch(72% 0.14 75), oklch(58% 0.16 60))", color: "white", border: "none" }}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving…</span>
                  ) : editingId ? "Save Changes" : "Create Box"}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Boxes List */}
        {boxesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(62% 0.14 65)" }} />
          </div>
        ) : !boxes || boxes.length === 0 ? (
          <div className="rounded-2xl p-12 text-center"
            style={{ background: "oklch(98.5% 0.012 85 / 0.8)", border: "1px solid oklch(72% 0.14 75 / 0.2)" }}>
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: "oklch(72% 0.14 75)" }} />
            <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              No Boxes Yet
            </h3>
            <p className="text-sm text-muted-foreground">
              {isPending ? "Create boxes once your account is approved." : "Create your first Surprise Box to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Your Boxes ({boxes.length})
            </h2>
            {boxes.map((box) => (
              <div
                key={box.id}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  background: "oklch(98.5% 0.012 85 / 0.92)",
                  border: "1px solid oklch(72% 0.14 75 / 0.2)",
                  boxShadow: "0 1px 8px oklch(72% 0.14 75 / 0.06)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-lg leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {box.title}
                    </h3>
                  </div>
                  {box.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{box.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-semibold" style={{ color: "oklch(52% 0.14 65)" }}>
                      ${parseFloat(box.price).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {box.quantityAvailable} available
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(box)}
                    className="h-8 w-8 p-0"
                    style={{ color: "oklch(52% 0.14 65)" }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate({ boxId: box.id })}
                    disabled={deleteMutation.isPending}
                    className="h-8 w-8 p-0"
                    style={{ color: "oklch(45% 0.22 25)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
