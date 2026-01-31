import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Package, AlertTriangle, Plus, Minus, RefreshCw, ArrowUpDown, Sparkles, Bot } from "lucide-react";
import { AIAssistant } from "@/components/AIAssistant";

export default function Inventory() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const canEdit = user?.role === 'super_admin' || user?.role === 'manager' || user?.role === 'employee';
  
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<string>("purchase");
  
  const { data: inventory, isLoading } = trpc.inventory.list.useQuery();
  const { data: skus } = trpc.skus.list.useQuery({});
  const { data: suppliers } = trpc.suppliers.list.useQuery({});
  const { data: lowStock } = trpc.inventory.lowStock.useQuery();
  const { data: transactions } = trpc.inventory.transactions.useQuery({ limit: 20 });
  
  const transactionMutation = trpc.inventory.createTransaction.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      utils.inventory.lowStock.invalidate();
      utils.inventory.transactions.invalidate();
      setIsTransactionOpen(false);
      setSelectedInventory(null);
      toast.success("Transaction recorded successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getSkuInfo = (skuId: number) => {
    const sku = skus?.find(s => s.id === skuId);
    if (!sku) return { name: `SKU #${skuId}`, supplier: null };
    const supplier = suppliers?.find(s => s.id === sku.supplierId);
    return { name: sku.name, grade: sku.grade, supplier };
  };

  const handleTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    transactionMutation.mutate({
      skuId: selectedInventory.skuId,
      transactionType: transactionType as any,
      quantityKg: formData.get("quantity") as string,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const openTransaction = (inv: any, type: string) => {
    setSelectedInventory(inv);
    setTransactionType(type);
    setIsTransactionOpen(true);
  };

  // Calculate totals
  const totalStock = inventory?.reduce((sum, inv) => sum + Number(inv.totalStockKg || 0), 0) || 0;
  const totalAllocated = inventory?.reduce((sum, inv) => sum + Number(inv.allocatedStockKg || 0), 0) || 0;
  const totalUnallocated = totalStock - totalAllocated;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold">Inventory Management</h2>
          <p className="text-muted-foreground mt-1">
            Track stock levels, allocations, and movements
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">{inventory?.length || 0} SKUs tracked</p>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Allocated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAllocated.toFixed(1)} kg</div>
            <Progress value={totalStock > 0 ? (totalAllocated / totalStock) * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalUnallocated.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">ready for allocation</p>
          </CardContent>
        </Card>
        <Card className={`card-elegant ${(lowStock?.length || 0) > 0 ? 'border-warning/50' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Low Stock Alerts
              {(lowStock?.length || 0) > 0 && <AlertTriangle className="h-4 w-4 text-warning" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(lowStock?.length || 0) > 0 ? 'text-warning' : ''}`}>
              {lowStock?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">items below threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert Banner */}
      {(lowStock?.length || 0) > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lowStock?.map((inv) => {
                const info = getSkuInfo(inv.skuId);
                const unallocated = Number(inv.totalStockKg) - Number(inv.allocatedStockKg);
                return (
                  <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
                    <div>
                      <p className="font-medium text-sm">{info.name}</p>
                      <p className="text-xs text-muted-foreground">{info.supplier?.name}</p>
                    </div>
                    <Badge variant="outline" className="text-warning border-warning/50">
                      {unallocated.toFixed(1)} kg
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg">Stock Levels</CardTitle>
          <CardDescription>Current inventory by product</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : inventory?.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No inventory data</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Add products to start tracking inventory
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Total Stock</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  {canEdit && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory?.map((inv) => {
                  const info = getSkuInfo(inv.skuId);
                  const total = Number(inv.totalStockKg) || 0;
                  const allocated = Number(inv.allocatedStockKg) || 0;
                  const available = total - allocated;
                  const threshold = Number(inv.lowStockThresholdKg) || 5;
                  const isLow = available <= threshold;
                  const isCritical = available <= threshold / 2;
                  
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        {info.name}
                        {info.grade && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {info.grade}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {info.supplier?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {total.toFixed(2)} kg
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {allocated.toFixed(2)} kg
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {available.toFixed(2)} kg
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {threshold.toFixed(2)} kg
                      </TableCell>
                      <TableCell className="text-center">
                        {isCritical ? (
                          <Badge variant="destructive">Critical</Badge>
                        ) : isLow ? (
                          <Badge variant="outline" className="text-warning border-warning/50">Low</Badge>
                        ) : (
                          <Badge variant="outline" className="text-primary border-primary/50">OK</Badge>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openTransaction(inv, 'purchase')}
                              title="Add Stock"
                            >
                              <Plus className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openTransaction(inv, 'allocation')}
                              title="Allocate"
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openTransaction(inv, 'adjustment')}
                              title="Adjust"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <CardDescription>Latest inventory movements</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions recorded yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((tx) => {
                  const info = getSkuInfo(tx.skuId);
                  const isPositive = ['purchase', 'deallocation'].includes(tx.transactionType);
                  
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{info.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {tx.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-mono ${isPositive ? 'text-primary' : 'text-destructive'}`}>
                        {isPositive ? '+' : '-'}{Number(tx.quantityKg).toFixed(2)} kg
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[200px]">
                        {tx.notes || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'purchase' && 'Add Stock'}
              {transactionType === 'allocation' && 'Allocate Stock'}
              {transactionType === 'deallocation' && 'Deallocate Stock'}
              {transactionType === 'adjustment' && 'Adjust Stock'}
              {transactionType === 'sale' && 'Record Sale'}
            </DialogTitle>
            <DialogDescription>
              {selectedInventory && getSkuInfo(selectedInventory.skuId).name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransaction}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Transaction Type</Label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase (Add Stock)</SelectItem>
                    <SelectItem value="sale">Sale (Remove Stock)</SelectItem>
                    <SelectItem value="allocation">Allocate to Order</SelectItem>
                    <SelectItem value="deallocation">Deallocate</SelectItem>
                    <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (kg) *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  placeholder="Enter quantity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Optional notes about this transaction..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTransactionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={transactionMutation.isPending}>
                {transactionMutation.isPending ? "Recording..." : "Record Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Insights Card */}
      <AIInsightsCard inventory={inventory || []} lowStock={lowStock || []} />

      {/* AI Assistant */}
      <AIAssistant 
        context="inventory" 
        contextData={{ inventory, lowStock }}
        suggestedQuestions={[
          "Which items need to be reordered soon?",
          "Forecast inventory levels for next 3 months",
          "Identify slow-moving inventory",
          "Suggest optimal stock levels per SKU",
        ]}
      />
    </div>
  );
}

// AI Insights Card Component
function AIInsightsCard({ inventory, lowStock }: { inventory: any[]; lowStock: any[] }) {
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
    getInsights.mutate({ type: 'inventory_reorder' });
  };

  return (
    <Card className="card-elegant border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AI Inventory Insights</CardTitle>
              <CardDescription>
                {lowStock.length > 0 
                  ? `${lowStock.length} items need attention` 
                  : "Get AI-powered reorder recommendations"}
              </CardDescription>
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
