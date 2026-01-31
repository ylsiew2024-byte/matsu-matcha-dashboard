import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Star, Leaf, Search } from "lucide-react";

const gradeColors: Record<string, string> = {
  ceremonial: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  premium: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  culinary: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  food_grade: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export default function Products() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const canEdit = user?.role === 'admin' || user?.role === 'operations';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<any>(null);
  
  const { data: skus, isLoading } = trpc.skus.list.useQuery({});
  const { data: suppliers } = trpc.suppliers.list.useQuery({});
  
  const createMutation = trpc.skus.create.useMutation({
    onSuccess: () => {
      utils.skus.list.invalidate();
      utils.inventory.list.invalidate();
      setIsCreateOpen(false);
      toast.success("Product created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updateMutation = trpc.skus.update.useMutation({
    onSuccess: () => {
      utils.skus.list.invalidate();
      setEditingSku(null);
      toast.success("Product updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const deleteMutation = trpc.skus.delete.useMutation({
    onSuccess: () => {
      utils.skus.list.invalidate();
      toast.success("Product deactivated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredSkus = skus?.filter(sku => 
    sku.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sku.grade?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSupplierName = (supplierId: number) => {
    return suppliers?.find(s => s.id === supplierId)?.name || "Unknown";
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      supplierId: parseInt(formData.get("supplierId") as string),
      grade: formData.get("grade") as "ceremonial" | "premium" | "culinary" | "food_grade",
      qualityTier: parseInt(formData.get("qualityTier") as string) || 3,
      isSeasonal: formData.get("isSeasonal") === "on",
      harvestSeason: formData.get("harvestSeason") as string || undefined,
      description: formData.get("description") as string || undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingSku.id,
      name: formData.get("name") as string,
      supplierId: parseInt(formData.get("supplierId") as string),
      grade: formData.get("grade") as "ceremonial" | "premium" | "culinary" | "food_grade",
      qualityTier: parseInt(formData.get("qualityTier") as string) || 3,
      isSeasonal: formData.get("isSeasonal") === "on",
      harvestSeason: formData.get("harvestSeason") as string || undefined,
      description: formData.get("description") as string || undefined,
    });
  };

  const renderQualityStars = (tier: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`h-3 w-3 ${i <= tier ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold">Product Catalog</h2>
          <p className="text-muted-foreground mt-1">
            Manage your matcha SKUs and product varieties
          </p>
        </div>
        {canEdit && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Enter the matcha product details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input id="name" name="name" required placeholder="e.g., Uji Premium Matcha" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplierId">Supplier *</Label>
                      <Select name="supplierId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers?.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade *</Label>
                      <Select name="grade" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ceremonial">Ceremonial</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="culinary">Culinary</SelectItem>
                          <SelectItem value="food_grade">Food Grade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qualityTier">Quality Tier (1-5)</Label>
                      <Select name="qualityTier" defaultValue="3">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Basic</SelectItem>
                          <SelectItem value="2">2 - Standard</SelectItem>
                          <SelectItem value="3">3 - Good</SelectItem>
                          <SelectItem value="4">4 - Excellent</SelectItem>
                          <SelectItem value="5">5 - Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="isSeasonal" name="isSeasonal" />
                      <Label htmlFor="isSeasonal">Seasonal Product</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="harvestSeason">Harvest Season</Label>
                      <Select name="harvestSeason">
                        <SelectTrigger>
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spring">Spring (First Flush)</SelectItem>
                          <SelectItem value="summer">Summer</SelectItem>
                          <SelectItem value="autumn">Autumn</SelectItem>
                          <SelectItem value="winter">Winter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="Product description, flavor notes, recommended uses..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Product"}
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
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
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
      ) : filteredSkus?.length === 0 ? (
        <Card className="card-elegant">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {searchQuery ? "Try a different search term" : "Add your first product to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSkus?.map((sku) => (
            <Card key={sku.id} className="card-elegant hover:shadow-elegant transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {sku.name}
                      {sku.isSeasonal && (
                        <Leaf className="h-4 w-4 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {getSupplierName(sku.supplierId)}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={gradeColors[sku.grade] || ""}>
                    {sku.grade?.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quality</span>
                  {renderQualityStars(sku.qualityTier || 3)}
                </div>
                
                {sku.harvestSeason && (
                  <div className="flex items-center gap-2 text-sm">
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{sku.harvestSeason} Harvest</span>
                  </div>
                )}
                
                {sku.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sku.description}
                  </p>
                )}
                
                {canEdit && (
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingSku(sku)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to deactivate this product?")) {
                          deleteMutation.mutate({ id: sku.id });
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

      {/* Edit Dialog */}
      <Dialog open={!!editingSku} onOpenChange={(open) => !open && setEditingSku(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          {editingSku && (
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Product Name *</Label>
                    <Input id="edit-name" name="name" required defaultValue={editingSku.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-supplierId">Supplier *</Label>
                    <Select name="supplierId" defaultValue={editingSku.supplierId?.toString()}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-grade">Grade *</Label>
                    <Select name="grade" defaultValue={editingSku.grade}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ceremonial">Ceremonial</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="culinary">Culinary</SelectItem>
                        <SelectItem value="food_grade">Food Grade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-qualityTier">Quality Tier (1-5)</Label>
                    <Select name="qualityTier" defaultValue={editingSku.qualityTier?.toString() || "3"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Basic</SelectItem>
                        <SelectItem value="2">2 - Standard</SelectItem>
                        <SelectItem value="3">3 - Good</SelectItem>
                        <SelectItem value="4">4 - Excellent</SelectItem>
                        <SelectItem value="5">5 - Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="edit-isSeasonal" name="isSeasonal" defaultChecked={editingSku.isSeasonal} />
                    <Label htmlFor="edit-isSeasonal">Seasonal Product</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-harvestSeason">Harvest Season</Label>
                    <Select name="harvestSeason" defaultValue={editingSku.harvestSeason || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spring">Spring (First Flush)</SelectItem>
                        <SelectItem value="summer">Summer</SelectItem>
                        <SelectItem value="autumn">Autumn</SelectItem>
                        <SelectItem value="winter">Winter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" name="description" defaultValue={editingSku.description || ""} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingSku(null)}>
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
    </div>
  );
}
