import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Truck, MapPin, Mail, Phone, Search, Clock, Sparkles, Bot } from "lucide-react";
import { AIAssistant } from "@/components/AIAssistant";

export default function Suppliers() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const canEdit = user?.role === 'super_admin' || user?.role === 'manager';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  
  const { data: suppliers, isLoading } = trpc.suppliers.list.useQuery({});
  
  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      utils.suppliers.list.invalidate();
      setIsCreateOpen(false);
      toast.success("Supplier created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updateMutation = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      utils.suppliers.list.invalidate();
      setEditingSupplier(null);
      toast.success("Supplier updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const deleteMutation = trpc.suppliers.delete.useMutation({
    onSuccess: () => {
      utils.suppliers.list.invalidate();
      toast.success("Supplier deactivated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredSuppliers = suppliers?.filter(supplier => 
    supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      country: formData.get("country") as string || "Japan",
      region: formData.get("region") as string || undefined,
      contactName: formData.get("contactName") as string || undefined,
      contactEmail: formData.get("contactEmail") as string || undefined,
      contactPhone: formData.get("contactPhone") as string || undefined,
      leadTimeDays: parseInt(formData.get("leadTimeDays") as string) || undefined,
      orderCadenceDays: parseInt(formData.get("orderCadenceDays") as string) || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingSupplier.id,
      name: formData.get("name") as string,
      country: formData.get("country") as string || "Japan",
      region: formData.get("region") as string || undefined,
      contactName: formData.get("contactName") as string || undefined,
      contactEmail: formData.get("contactEmail") as string || undefined,
      contactPhone: formData.get("contactPhone") as string || undefined,
      leadTimeDays: parseInt(formData.get("leadTimeDays") as string) || undefined,
      orderCadenceDays: parseInt(formData.get("orderCadenceDays") as string) || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold">Supplier Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage your Japanese matcha suppliers
          </p>
        </div>
        {canEdit && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
                <DialogDescription>
                  Enter the supplier's information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Supplier Name *</Label>
                      <Input id="name" name="name" required placeholder="e.g., Marukyu Koyamaen" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Input id="region" name="region" placeholder="e.g., Uji, Kyoto" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" name="country" defaultValue="Japan" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input id="contactName" name="contactName" placeholder="Primary contact" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input id="contactEmail" name="contactEmail" type="email" placeholder="email@example.jp" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input id="contactPhone" name="contactPhone" placeholder="+81 xxx xxxx" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
                      <Input id="leadTimeDays" name="leadTimeDays" type="number" min="1" defaultValue="30" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orderCadenceDays">Order Cadence (days)</Label>
                      <Input id="orderCadenceDays" name="orderCadenceDays" type="number" min="1" defaultValue="45" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" placeholder="Additional notes about this supplier..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Supplier"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="card-elegant">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSuppliers?.length === 0 ? (
        <Card className="card-elegant">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No suppliers found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {searchQuery ? "Try a different search term" : "Add your first supplier to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers?.map((supplier) => (
            <Card key={supplier.id} className="card-elegant hover:shadow-elegant transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {supplier.region ? `${supplier.region}, ` : ""}{supplier.country || "Japan"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    🇯🇵 Japan
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {supplier.contactName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.contactName}</span>
                  </div>
                )}
                {supplier.contactEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{supplier.contactEmail}</span>
                  </div>
                )}
                {supplier.contactPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.contactPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{supplier.leadTimeDays || 30}d lead</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{supplier.orderCadenceDays || 45}d cadence</span>
                  </div>
                </div>
                
                {canEdit && (
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingSupplier(supplier)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to deactivate this supplier?")) {
                          deleteMutation.mutate({ id: supplier.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Insights Card */}
      <AIInsightsCard suppliers={filteredSuppliers || []} />

      {/* Edit Dialog */}
      <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update supplier information
            </DialogDescription>
          </DialogHeader>
          {editingSupplier && (
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Supplier Name *</Label>
                    <Input id="edit-name" name="name" required defaultValue={editingSupplier.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-region">Region</Label>
                    <Input id="edit-region" name="region" defaultValue={editingSupplier.region || ""} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-country">Country</Label>
                    <Input id="edit-country" name="country" defaultValue={editingSupplier.country || "Japan"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-contactName">Contact Name</Label>
                    <Input id="edit-contactName" name="contactName" defaultValue={editingSupplier.contactName || ""} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-contactEmail">Email</Label>
                    <Input id="edit-contactEmail" name="contactEmail" type="email" defaultValue={editingSupplier.contactEmail || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-contactPhone">Phone</Label>
                    <Input id="edit-contactPhone" name="contactPhone" defaultValue={editingSupplier.contactPhone || ""} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-leadTimeDays">Lead Time (days)</Label>
                    <Input id="edit-leadTimeDays" name="leadTimeDays" type="number" min="1" defaultValue={editingSupplier.leadTimeDays || 30} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-orderCadenceDays">Order Cadence (days)</Label>
                    <Input id="edit-orderCadenceDays" name="orderCadenceDays" type="number" min="1" defaultValue={editingSupplier.orderCadenceDays || 45} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea id="edit-notes" name="notes" defaultValue={editingSupplier.notes || ""} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingSupplier(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Assistant */}
      <AIAssistant 
        context="suppliers" 
        contextData={filteredSuppliers}
        suggestedQuestions={[
          "Compare my suppliers by cost efficiency",
          "Which supplier has the best lead times?",
          "Suggest optimal order quantities per supplier",
          "Analyze supplier reliability and quality",
        ]}
      />
    </div>
  );
}

// AI Insights Card Component
function AIInsightsCard({ suppliers }: { suppliers: any[] }) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getInsights = trpc.ai.bulkRecommendations.useMutation({
    onSuccess: (data) => {
      setInsights(data.recommendations);
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  const handleGetInsights = () => {
    setIsLoading(true);
    getInsights.mutate({ type: 'supplier_consolidation' });
  };

  if (suppliers.length === 0) return null;

  return (
    <Card className="card-elegant border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AI Supplier Insights</CardTitle>
              <CardDescription>Get AI-powered supplier analysis and recommendations</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetInsights}
            disabled={isLoading}
            className="gap-1"
          >
            <Sparkles className="h-3 w-3" />
            {isLoading ? "Analyzing..." : "Get Insights"}
          </Button>
        </div>
      </CardHeader>
      {insights && (
        <CardContent className="pt-0">
          <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-xs">{insights}</pre>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
