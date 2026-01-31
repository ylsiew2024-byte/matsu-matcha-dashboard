import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { 
  Plus, DollarSign, Calculator, TrendingUp, TrendingDown, Info, Lock, 
  Sparkles, AlertTriangle, Calendar, Package, ArrowRight, RefreshCw,
  Lightbulb, CheckCircle2, XCircle
} from "lucide-react";
import { useSecurity } from "@/contexts/SecurityContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types for profit calculator
interface ProfitCalculation {
  costPriceJpy: number;
  exchangeRate: number;
  costPriceSgd: number;
  shippingFeePerKg: number;
  importTaxRate: number;
  importTaxAmount: number;
  totalLandedCost: number;
  sellingPricePerKg: number;
  clientDiscount: number;
  effectiveSellingPrice: number;
  profitPerKg: number;
  marginPercent: number;
  monthlyQuantityKg: number;
  totalMonthlyProfit: number;
  annualizedProfit: number;
}

interface ClientProfitEntry {
  clientId: number;
  clientName: string;
  skuId: number;
  skuName: string;
  supplierId: number;
  supplierName: string;
  calculation: ProfitCalculation;
  inventoryInStock: number;
  lastOrderDate: Date | null;
  lastStockArrival: Date | null;
  daysToNextOrder: number;
  quantityRequiredKg: number;
  nextDeliveryDate: Date | null;
  orderingCadence: string;
}

interface AiRecommendation {
  currentSku: string;
  recommendedSku: string;
  currentMargin: number;
  potentialMargin: number;
  marginImprovement: number;
  qualityMatch: string;
  reason: string;
}

export default function Pricing() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { hasPermission, isPanicMode } = useSecurity();
  const canEdit = hasPermission('canEditPricing');
  const canViewCosts = hasPermission('canViewCosts');
  const shouldBlur = isPanicMode || !canViewCosts;
  const canViewMargins = hasPermission('canViewMargins');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("pricing");
  
  // Form state for live calculation
  const [costJpy, setCostJpy] = useState("");
  const [exchangeRate, setExchangeRate] = useState("110");
  const [shippingFee, setShippingFee] = useState("15");
  const [taxRate, setTaxRate] = useState("9");
  const [sellingPrice, setSellingPrice] = useState("");
  const [clientDiscount, setClientDiscount] = useState("0");
  const [monthlyQty, setMonthlyQty] = useState("");
  const [inventoryStock, setInventoryStock] = useState("");
  const [lastOrderDate, setLastOrderDate] = useState("");
  const [lastArrivalDate, setLastArrivalDate] = useState("");
  const [nextDeliveryDate, setNextDeliveryDate] = useState("");
  const [orderingCadence, setOrderingCadence] = useState("1");

  const { data: pricing, isLoading } = trpc.pricing.current.useQuery();
  const { data: skus } = trpc.skus.list.useQuery({});
  const { data: suppliers } = trpc.suppliers.list.useQuery({});
  const { data: clients } = trpc.clients.list.useQuery({});
  const { data: inventory } = trpc.inventory.list.useQuery();
  const { data: clientRelations } = trpc.clientProductRelations?.list?.useQuery() || { data: [] };
  
  const createMutation = trpc.pricing.create.useMutation({
    onSuccess: () => {
      utils.pricing.current.invalidate();
      setIsCreateOpen(false);
      resetForm();
      toast.success("Pricing created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSelectedSkuId("");
    setSelectedClientId("");
    setCostJpy("");
    setExchangeRate("110");
    setShippingFee("15");
    setTaxRate("9");
    setSellingPrice("");
    setClientDiscount("0");
    setMonthlyQty("");
    setInventoryStock("");
    setLastOrderDate("");
    setLastArrivalDate("");
    setNextDeliveryDate("");
    setOrderingCadence("1");
  };

  // Calculate full profit breakdown
  const profitCalculation = useMemo((): ProfitCalculation | null => {
    if (!costJpy || !exchangeRate || !sellingPrice) return null;
    
    const costPriceJpy = Number(costJpy);
    const rate = Number(exchangeRate);
    const costPriceSgd = costPriceJpy / rate;
    const shippingFeePerKg = Number(shippingFee) || 15;
    const importTaxRate = Number(taxRate) / 100 || 0.09;
    const subtotal = costPriceSgd + shippingFeePerKg;
    const importTaxAmount = subtotal * importTaxRate;
    const totalLandedCost = subtotal + importTaxAmount;
    const sellingPricePerKg = Number(sellingPrice);
    const discount = Number(clientDiscount) / 100 || 0;
    const effectiveSellingPrice = sellingPricePerKg * (1 - discount);
    const profitPerKg = effectiveSellingPrice - totalLandedCost;
    const marginPercent = (profitPerKg / effectiveSellingPrice) * 100;
    const monthlyQuantityKg = Number(monthlyQty) || 0;
    const totalMonthlyProfit = profitPerKg * monthlyQuantityKg;
    const annualizedProfit = totalMonthlyProfit * 12;
    
    return {
      costPriceJpy,
      exchangeRate: rate,
      costPriceSgd,
      shippingFeePerKg,
      importTaxRate,
      importTaxAmount,
      totalLandedCost,
      sellingPricePerKg,
      clientDiscount: discount * 100,
      effectiveSellingPrice,
      profitPerKg,
      marginPercent,
      monthlyQuantityKg,
      totalMonthlyProfit,
      annualizedProfit,
    };
  }, [costJpy, exchangeRate, shippingFee, taxRate, sellingPrice, clientDiscount, monthlyQty]);

  // Calculate days to next order
  const daysToNextOrder = useMemo(() => {
    if (!lastOrderDate || !orderingCadence) return null;
    const lastOrder = new Date(lastOrderDate);
    const cadenceMonths = Number(orderingCadence);
    const nextOrderDate = new Date(lastOrder);
    nextOrderDate.setMonth(nextOrderDate.getMonth() + cadenceMonths);
    const today = new Date();
    const diffTime = nextOrderDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [lastOrderDate, orderingCadence]);

  // Calculate quantity required to fulfill
  const quantityRequired = useMemo(() => {
    if (!monthlyQty || !inventoryStock) return null;
    const monthly = Number(monthlyQty);
    const stock = Number(inventoryStock);
    const cadenceMonths = Number(orderingCadence) || 1;
    const required = (monthly * cadenceMonths) - stock;
    return Math.max(0, required);
  }, [monthlyQty, inventoryStock, orderingCadence]);

  // Generate AI recommendations for higher profitability swaps
  const aiRecommendations = useMemo((): AiRecommendation[] => {
    if (!pricing || !skus || !suppliers) return [];
    
    const recommendations: AiRecommendation[] = [];
    
    // Find products with low margins and suggest alternatives
    pricing.forEach(p => {
      const sku = skus.find(s => s.id === p.skuId);
      if (!sku) return;
      
      const landed = Number(p.landedCostSgd) || 0;
      const selling = Number(p.sellingPricePerKg) || 0;
      if (selling === 0) return;
      
      const currentMargin = ((selling - landed) / selling) * 100;
      
      // Only recommend if margin is below 25%
      if (currentMargin >= 25) return;
      
      // Find alternative SKUs with same or better grade and higher margin potential
      const gradeRank: Record<string, number> = {
        'Ceremonial': 4,
        'Premium': 3,
        'Culinary': 2,
        'Food Grade': 1,
      };
      
      const currentGradeRank = gradeRank[sku.grade || ''] || 0;
      
      // Find better alternatives
      const alternatives = pricing.filter(alt => {
        if (alt.id === p.id) return false;
        const altSku = skus.find(s => s.id === alt.skuId);
        if (!altSku) return false;
        
        const altGradeRank = gradeRank[altSku.grade || ''] || 0;
        if (altGradeRank < currentGradeRank) return false; // Must be same or better quality
        
        const altLanded = Number(alt.landedCostSgd) || 0;
        const altSelling = Number(alt.sellingPricePerKg) || 0;
        if (altSelling === 0) return false;
        
        const altMargin = ((altSelling - altLanded) / altSelling) * 100;
        return altMargin > currentMargin + 5; // At least 5% better margin
      });
      
      if (alternatives.length > 0) {
        // Pick the best alternative
        const best = alternatives.reduce((best, alt) => {
          const altLanded = Number(alt.landedCostSgd) || 0;
          const altSelling = Number(alt.sellingPricePerKg) || 0;
          const altMargin = ((altSelling - altLanded) / altSelling) * 100;
          
          const bestLanded = Number(best.landedCostSgd) || 0;
          const bestSelling = Number(best.sellingPricePerKg) || 0;
          const bestMargin = ((bestSelling - bestLanded) / bestSelling) * 100;
          
          return altMargin > bestMargin ? alt : best;
        });
        
        const bestSku = skus.find(s => s.id === best.skuId);
        const bestLanded = Number(best.landedCostSgd) || 0;
        const bestSelling = Number(best.sellingPricePerKg) || 0;
        const bestMargin = ((bestSelling - bestLanded) / bestSelling) * 100;
        
        recommendations.push({
          currentSku: sku.name,
          recommendedSku: bestSku?.name || 'Unknown',
          currentMargin,
          potentialMargin: bestMargin,
          marginImprovement: bestMargin - currentMargin,
          qualityMatch: bestSku?.grade === sku.grade ? 'Same Quality' : 'Better Quality',
          reason: `Switch from ${sku.name} to ${bestSku?.name} for ${(bestMargin - currentMargin).toFixed(1)}% margin improvement with ${bestSku?.grade === sku.grade ? 'same' : 'better'} quality.`,
        });
      }
    });
    
    return recommendations.sort((a, b) => b.marginImprovement - a.marginImprovement);
  }, [pricing, skus, suppliers]);

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
            Manage costs, calculate profitability, and get AI recommendations
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

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing Table
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4" />
            Profit Calculator
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Pricing Table Tab */}
        <TabsContent value="pricing" className="space-y-6">
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
                        {items.map((item: any) => {
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
                                {canViewCosts && !shouldBlur ? (
                                  <span>¥{Number(item.costPriceJpy).toLocaleString()}</span>
                                ) : (
                                  <span className="flex items-center justify-end gap-1 text-muted-foreground">
                                    <Lock className="h-3 w-3" />
                                    <span className="blur-sm select-none">¥0,000</span>
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {canViewCosts && !shouldBlur ? (
                                  Number(item.exchangeRate).toFixed(2)
                                ) : (
                                  <span className="blur-sm select-none">0.00</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {canViewCosts && !shouldBlur ? (
                                  <span>${landed.toFixed(2)}</span>
                                ) : (
                                  <span className="flex items-center justify-end gap-1 text-muted-foreground">
                                    <Lock className="h-3 w-3" />
                                    <span className="blur-sm select-none">$0.00</span>
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${selling.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                {canViewMargins && !shouldBlur ? (
                                  <Badge 
                                    variant={margin >= 20 ? "default" : margin >= 15 ? "secondary" : "destructive"}
                                    className="font-mono"
                                  >
                                    {margin.toFixed(1)}%
                                  </Badge>
                                ) : (
                                  <span className="flex items-center justify-end gap-1 text-muted-foreground">
                                    <Lock className="h-3 w-3" />
                                    <span className="blur-sm select-none">00.0%</span>
                                  </span>
                                )}
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
        </TabsContent>

        {/* Profit Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Form */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Profit Calculator
                </CardTitle>
                <CardDescription>
                  Enter values to calculate profitability and analysis automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Client & Product Selection */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Client & Product
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Select value={selectedClientId} onValueChange={setSelectedClientId}>
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
                      <Label>Product (SKU)</Label>
                      <Select value={selectedSkuId} onValueChange={setSelectedSkuId}>
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
                  </div>
                </div>

                <Separator />

                {/* Cost & Pricing Inputs */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Cost & Pricing
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cost Price (JPY/kg)</Label>
                      <Input
                        type="number"
                        value={costJpy}
                        onChange={(e) => setCostJpy(e.target.value)}
                        placeholder="e.g., 15000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Exchange Rate (JPY→SGD)</Label>
                      <Input
                        type="number"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        placeholder="110"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Shipping Fee (SGD/kg)</Label>
                      <Input
                        type="number"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(e.target.value)}
                        placeholder="15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Import Tax (%)</Label>
                      <Input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        placeholder="9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Price (SGD/kg)</Label>
                      <Input
                        type="number"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="e.g., 250"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Discount (%)</Label>
                      <Input
                        type="number"
                        value={clientDiscount}
                        onChange={(e) => setClientDiscount(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Volume & Inventory */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Volume & Inventory
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Monthly Quantity (kg)</Label>
                      <Input
                        type="number"
                        value={monthlyQty}
                        onChange={(e) => setMonthlyQty(e.target.value)}
                        placeholder="e.g., 50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inventory in Stock (kg)</Label>
                      <Input
                        type="number"
                        value={inventoryStock}
                        onChange={(e) => setInventoryStock(e.target.value)}
                        placeholder="e.g., 100"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Ordering & Logistics */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Ordering & Logistics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Last Order Date</Label>
                      <Input
                        type="date"
                        value={lastOrderDate}
                        onChange={(e) => setLastOrderDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Stock Arrival</Label>
                      <Input
                        type="date"
                        value={lastArrivalDate}
                        onChange={(e) => setLastArrivalDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ordering Cadence</Label>
                      <Select value={orderingCadence} onValueChange={setOrderingCadence}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Every 1 month</SelectItem>
                          <SelectItem value="2">Every 2 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Next Delivery (Client)</Label>
                      <Input
                        type="date"
                        value={nextDeliveryDate}
                        onChange={(e) => setNextDeliveryDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="space-y-6">
              {/* Cost Breakdown */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profitCalculation ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cost Price (JPY)</span>
                        <span>¥{profitCalculation.costPriceJpy.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">÷ Exchange Rate</span>
                        <span>{profitCalculation.exchangeRate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">= Cost Price (SGD)</span>
                        <span>${profitCalculation.costPriceSgd.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">+ Shipping Fee</span>
                        <span>${profitCalculation.shippingFeePerKg.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">+ Import Tax ({(profitCalculation.importTaxRate * 100).toFixed(0)}%)</span>
                        <span>${profitCalculation.importTaxAmount.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Total Landed Cost</span>
                        <span className="text-primary">${profitCalculation.totalLandedCost.toFixed(2)}/kg</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Enter cost values to see breakdown
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Profit Analysis */}
              <Card className={`card-elegant ${profitCalculation && profitCalculation.profitPerKg < 0 ? 'border-destructive' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {profitCalculation && profitCalculation.profitPerKg >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-primary" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                    Profit Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profitCalculation ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Selling Price</span>
                          <span>${profitCalculation.sellingPricePerKg.toFixed(2)}/kg</span>
                        </div>
                        {profitCalculation.clientDiscount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">- Client Discount ({profitCalculation.clientDiscount}%)</span>
                            <span>-${(profitCalculation.sellingPricePerKg - profitCalculation.effectiveSellingPrice).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Effective Selling Price</span>
                          <span>${profitCalculation.effectiveSellingPrice.toFixed(2)}/kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">- Landed Cost</span>
                          <span>-${profitCalculation.totalLandedCost.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Profit per kg</span>
                          <span className={profitCalculation.profitPerKg >= 0 ? 'text-primary' : 'text-destructive'}>
                            ${profitCalculation.profitPerKg.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Margin</span>
                          <Badge variant={profitCalculation.marginPercent >= 20 ? "default" : profitCalculation.marginPercent >= 0 ? "secondary" : "destructive"}>
                            {profitCalculation.marginPercent.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>

                      {profitCalculation.monthlyQuantityKg > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Monthly Quantity</span>
                              <span>{profitCalculation.monthlyQuantityKg} kg</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Monthly Profit</span>
                              <span className={profitCalculation.totalMonthlyProfit >= 0 ? 'text-primary' : 'text-destructive'}>
                                ${profitCalculation.totalMonthlyProfit.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Annualized Profit</span>
                              <span className={profitCalculation.annualizedProfit >= 0 ? 'text-primary' : 'text-destructive'}>
                                ${profitCalculation.annualizedProfit.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Warning for negative profit */}
                      {profitCalculation.profitPerKg < 0 && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Negative profit margin detected!</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Enter pricing values to see profit analysis
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Inventory & Ordering Status */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Inventory & Ordering
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Inventory in Stock</span>
                      <span>{inventoryStock || '-'} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Order Date</span>
                      <span>{lastOrderDate || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Stock Arrival</span>
                      <span>{lastArrivalDate || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ordering Cadence</span>
                      <span>Every {orderingCadence} month(s)</span>
                    </div>
                    {daysToNextOrder !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Days to Next Order</span>
                        <Badge variant={daysToNextOrder <= 7 ? "destructive" : daysToNextOrder <= 14 ? "secondary" : "outline"}>
                          {daysToNextOrder} days
                        </Badge>
                      </div>
                    )}
                    {quantityRequired !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Quantity Required</span>
                        <span className={quantityRequired > 0 ? 'text-warning font-medium' : ''}>
                          {quantityRequired > 0 ? `${quantityRequired.toFixed(1)} kg needed` : 'Sufficient stock'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next Client Delivery</span>
                      <span>{nextDeliveryDate || '-'}</span>
                    </div>

                    {/* Warning for insufficient inventory */}
                    {quantityRequired !== null && quantityRequired > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg text-warning mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Insufficient inventory! Order {quantityRequired.toFixed(1)} kg more.
                        </span>
                      </div>
                    )}

                    {/* Warning for missed reorder window */}
                    {daysToNextOrder !== null && daysToNextOrder < 0 && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Reorder window missed by {Math.abs(daysToNextOrder)} days!
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Profitability Recommendations
              </CardTitle>
              <CardDescription>
                Suggestions to swap to higher-profitability matcha with same or better quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiRecommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-primary/50 mb-4" />
                  <h3 className="text-lg font-medium">All products are optimized!</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    No low-margin products found that could be swapped for better alternatives.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiRecommendations.map((rec, index) => (
                    <Card key={index} className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-primary" />
                              <span className="font-medium">Swap Recommendation</span>
                              <Badge variant="outline" className="text-xs">
                                {rec.qualityMatch}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">{rec.currentSku}</span>
                              <ArrowRight className="h-4 w-4" />
                              <span className="font-medium text-primary">{rec.recommendedSku}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{rec.currentMargin.toFixed(1)}%</span>
                              <ArrowRight className="h-4 w-4 text-primary" />
                              <Badge variant="default" className="font-mono">
                                {rec.potentialMargin.toFixed(1)}%
                              </Badge>
                            </div>
                            <p className="text-xs text-primary mt-1">
                              +{rec.marginImprovement.toFixed(1)}% improvement
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
