import { useState, useMemo } from "react";
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
import { toast } from "sonner";
import { Plus, DollarSign, Calculator, TrendingUp, TrendingDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Pricing() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const canEdit = user?.role === 'admin' || user?.role === 'finance';
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState<string>("");
  
  // Form state for live calculation
  const [costJpy, setCostJpy] = useState("");
  const [exchangeRate, setExchangeRate] = useState("110");
  const [shippingFee, setShippingFee] = useState("15");
  const [taxRate, setTaxRate] = useState("9");
  const [sellingPrice, setSellingPrice] = useState("");
  
  const { data: pricing, isLoading } = trpc.pricing.current.useQuery();
  const { data: skus } = trpc.skus.list.useQuery({});
  const { data: suppliers } = trpc.suppliers.list.useQuery({});
  
  const createMutation = trpc.pricing.create.useMutation({
    onSuccess: () => {
      utils.pricing.current.invalidate();
      setIsCreateOpen(false);
      resetForm();
      toast.success("Pricing created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSelectedSkuId("");
    setCostJpy("");
    setExchangeRate("110");
    setShippingFee("15");
    setTaxRate("9");
    setSellingPrice("");
  };

  // Calculate landed cost
  const calculatedLandedCost = useMemo(() => {
    if (!costJpy || !exchangeRate) return null;
    const costSgd = Number(costJpy) / Number(exchangeRate);
    const shipping = Number(shippingFee) || 15;
    const tax = Number(taxRate) / 100 || 0.09;
    return (costSgd + shipping) * (1 + tax);
  }, [costJpy, exchangeRate, shippingFee, taxRate]);

  // Calculate profit margin
  const calculatedProfit = useMemo(() => {
    if (!calculatedLandedCost || !sellingPrice) return null;
    const profit = Number(sellingPrice) - calculatedLandedCost;
    const margin = (profit / Number(sellingPrice)) * 100;
    return { profit, margin };
  }, [calculatedLandedCost, sellingPrice]);

  const getSkuName = (skuId: number) => {
    return skus?.find(s => s.id === skuId)?.name || `SKU #${skuId}`;
  };

  const getSupplierForSku = (skuId: number) => {
    const sku = skus?.find(s => s.id === skuId);
    if (!sku) return null;
    return suppliers?.find(s => s.id === sku.supplierId);
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMutation.mutate({
      skuId: parseInt(selectedSkuId),
      costPriceJpy: costJpy,
      exchangeRate: exchangeRate,
      shippingFeePerKg: shippingFee,
      importTaxRate: (Number(taxRate) / 100).toString(),
      sellingPricePerKg: sellingPrice,
    });
  };

  // Group pricing by supplier
  const pricingBySupplier = useMemo(() => {
    if (!pricing || !skus || !suppliers) return [];
    
    const grouped: Record<number, { supplier: any; items: any[] }> = {};
    
    pricing.forEach(p => {
      const sku = skus.find(s => s.id === p.skuId);
      if (!sku) return;
      
      const supplier = suppliers.find(s => s.id === sku.supplierId);
      if (!supplier) return;
      
      if (!grouped[supplier.id]) {
        grouped[supplier.id] = { supplier, items: [] };
      }
      
      grouped[supplier.id].items.push({ ...p, sku });
    });
    
    return Object.values(grouped);
  }, [pricing, skus, suppliers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold">Pricing Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage costs, landed prices, and profit margins
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
                Set Pricing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Set Product Pricing</DialogTitle>
                <DialogDescription>
                  Configure cost and selling price for a product
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="grid gap-4 py-4">
                  {/* Product Selection */}
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

                  {/* Cost Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="costJpy" className="flex items-center gap-1">
                        Cost Price (JPY/kg) *
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Supplier cost per kilogram in Japanese Yen
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="costJpy"
                        type="number"
                        step="0.01"
                        min="0"
                        value={costJpy}
                        onChange={(e) => setCostJpy(e.target.value)}
                        placeholder="e.g., 15000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exchangeRate">Exchange Rate (JPY → SGD) *</Label>
                      <Input
                        id="exchangeRate"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        placeholder="e.g., 110"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingFee">Shipping Fee (SGD/kg)</Label>
                      <Input
                        id="shippingFee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(e.target.value)}
                        placeholder="15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Import Tax (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        placeholder="9"
                      />
                    </div>
                  </div>

                  {/* Calculated Landed Cost */}
                  {calculatedLandedCost && (
                    <Card className="bg-muted/50">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Calculated Landed Cost</span>
                          </div>
                          <span className="text-lg font-bold text-primary">
                            SGD {calculatedLandedCost.toFixed(2)}/kg
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          = (¥{costJpy} ÷ {exchangeRate} + ${shippingFee}) × (1 + {taxRate}%)
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Selling Price */}
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Selling Price (SGD/kg) *</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="e.g., 250"
                      required
                    />
                  </div>

                  {/* Profit Preview */}
                  {calculatedProfit && (
                    <Card className={calculatedProfit.margin >= 20 ? "bg-primary/5 border-primary/20" : "bg-warning/5 border-warning/20"}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {calculatedProfit.margin >= 20 ? (
                              <TrendingUp className="h-4 w-4 text-primary" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-warning" />
                            )}
                            <span className="text-sm font-medium">Profit Margin</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              SGD {calculatedProfit.profit.toFixed(2)}/kg
                            </div>
                            <Badge variant={calculatedProfit.margin >= 20 ? "default" : "outline"}>
                              {calculatedProfit.margin.toFixed(1)}% margin
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Save Pricing"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products Priced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pricing?.length || 0}</div>
            <p className="text-xs text-muted-foreground">of {skus?.length || 0} total SKUs</p>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pricing && pricing.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {(pricing.reduce((sum, p) => {
                    const landed = Number(p.landedCostSgd) || 0;
                    const selling = Number(p.sellingPricePerKg) || 0;
                    if (selling === 0) return sum;
                    return sum + ((selling - landed) / selling * 100);
                  }, 0) / pricing.length).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">across all products</p>
              </>
            ) : (
              <div className="text-2xl font-bold">-</div>
            )}
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Margin Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {pricing?.filter(p => {
                const landed = Number(p.landedCostSgd) || 0;
                const selling = Number(p.sellingPricePerKg) || 0;
                if (selling === 0) return false;
                return ((selling - landed) / selling * 100) < 15;
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">products below 15%</p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Table */}
      {isLoading ? (
        <Card className="card-elegant">
          <CardContent className="py-8">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : pricingBySupplier.length === 0 ? (
        <Card className="card-elegant">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No pricing configured</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Set up pricing for your products to see them here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pricingBySupplier.map(({ supplier, items }) => (
            <Card key={supplier.id} className="card-elegant">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {supplier.name}
                  <Badge variant="outline" className="text-xs">
                    {items.length} products
                  </Badge>
                </CardTitle>
                <CardDescription>{supplier.region}, {supplier.country}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Cost (JPY)</TableHead>
                      <TableHead className="text-right">Exchange Rate</TableHead>
                      <TableHead className="text-right">Landed Cost</TableHead>
                      <TableHead className="text-right">Selling Price</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const landed = Number(item.landedCostSgd) || 0;
                      const selling = Number(item.sellingPricePerKg) || 0;
                      const profit = selling - landed;
                      const margin = selling > 0 ? (profit / selling * 100) : 0;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.sku.name}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.sku.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            ¥{Number(item.costPriceJpy).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(item.exchangeRate).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${landed.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${selling.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={margin >= 20 ? "default" : margin >= 15 ? "secondary" : "destructive"}
                              className="font-mono"
                            >
                              {margin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
