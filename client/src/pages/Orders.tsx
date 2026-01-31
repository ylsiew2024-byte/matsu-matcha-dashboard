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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, TrendingUp, Package, Clock, CheckCircle2, XCircle, Search } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  processing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  shipped: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  delivered: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function Orders() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const canEdit = user?.role === 'super_admin' || user?.role === 'manager' || user?.role === 'employee';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedSkuId, setSelectedSkuId] = useState<string>("");
  
  const { data: orders, isLoading } = trpc.clientOrders.list.useQuery({});
  const { data: clients } = trpc.clients.list.useQuery({});
  const { data: skus } = trpc.skus.list.useQuery({});
  const { data: pricing } = trpc.pricing.current.useQuery();
  
  const createMutation = trpc.clientOrders.create.useMutation({
    onSuccess: () => {
      utils.clientOrders.list.invalidate();
      utils.inventory.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
      toast.success("Order created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  const updateStatusMutation = trpc.clientOrders.update.useMutation({
    onSuccess: () => {
      utils.clientOrders.list.invalidate();
      toast.success("Order status updated");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSelectedClientId("");
    setSelectedSkuId("");
  };

  const getClientName = (clientId: number) => {
    return clients?.find(c => c.id === clientId)?.name || `Client #${clientId}`;
  };

  const getSkuName = (skuId: number) => {
    return skus?.find(s => s.id === skuId)?.name || `SKU #${skuId}`;
  };

  const getSkuPrice = (skuId: number) => {
    const price = pricing?.find(p => p.skuId === skuId);
    return price ? Number(price.sellingPricePerKg) : null;
  };

  const filteredOrders = orders?.filter((order: any) => {
    const clientName = getClientName(order.clientId).toLowerCase();
    const skuName = getSkuName(order.skuId).toLowerCase();
    return clientName.includes(searchQuery.toLowerCase()) || 
           skuName.includes(searchQuery.toLowerCase()) ||
           order.status?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      clientId: parseInt(selectedClientId),
      skuId: parseInt(selectedSkuId),
      quantityKg: formData.get("quantity") as string,
      unitPriceSgd: formData.get("unitPrice") as string,
      notes: formData.get("notes") as string || undefined,
    });
  };

  // Calculate summary stats
  const pendingOrders = orders?.filter((o: { status?: string | null }) => o.status === 'pending').length || 0;
  const processingOrders = orders?.filter((o: { status?: string | null }) => ['confirmed', 'processing', 'shipped'].includes(o.status || '')).length || 0;
  const completedOrders = orders?.filter((o: { status?: string | null }) => o.status === 'delivered').length || 0;
  const totalRevenue = orders?.filter((o: { status?: string | null }) => o.status === 'delivered')
    .reduce((sum: number, o: { totalPriceSgd?: string | null }) => sum + Number(o.totalPriceSgd || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold">Order Management</h2>
          <p className="text-muted-foreground mt-1">
            Track and manage client orders
          </p>
        </div>
        {canEdit && (
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Enter order details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client *</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skuId">Product *</Label>
                    <Select value={selectedSkuId} onValueChange={setSelectedSkuId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {skus?.map(sku => (
                          <SelectItem key={sku.id} value={sku.id.toString()}>
                            {sku.name} ({sku.grade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity (kg) *</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        step="0.001"
                        min="0"
                        required
                        placeholder="e.g., 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">Unit Price (SGD/kg) *</Label>
                      <Input
                        id="unitPrice"
                        name="unitPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder={selectedSkuId ? getSkuPrice(parseInt(selectedSkuId))?.toString() || "" : ""}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Order notes..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Order"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingOrders}</div>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{completedOrders}</div>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SGD {totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orders Table */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg">All Orders</CardTitle>
          <CardDescription>Manage order status and details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredOrders?.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No orders found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery ? "Try a different search term" : "Create your first order to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  {canEdit && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {getClientName(order.clientId)}
                    </TableCell>
                    <TableCell>{getSkuName(order.skuId)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(order.quantityKg).toFixed(2)} kg
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      SGD {Number(order.totalPriceSgd).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={statusColors[order.status || 'pending']}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Select
                          value={order.status || 'pending'}
                          onValueChange={(value) => {
                            updateStatusMutation.mutate({
                              id: order.id,
                              status: value as any,
                            });
                          }}
                        >
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
