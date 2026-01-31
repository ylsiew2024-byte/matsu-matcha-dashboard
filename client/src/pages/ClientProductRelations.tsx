import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calculator,
  RefreshCw,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useSecurity } from "@/contexts/SecurityContext";
import { SensitiveValue } from "@/components/SensitiveValue";

// Default values
const DEFAULT_SHIPPING_FEE = 15.0;
const DEFAULT_IMPORT_TAX_RATE = 0.09;
const DEFAULT_EXCHANGE_RATE = 0.0091; // JPY to SGD (approx 110 JPY = 1 SGD)

interface FormData {
  clientId: number | null;
  skuId: number | null;
  supplierId: number | null;
  qualityTier: "standard" | "premium" | "seasonal";
  costPriceJpy: string;
  exchangeRate: string;
  shippingFeePerKg: string;
  importTaxRate: string;
  sellingPricePerKg: string;
  specialDiscountPercent: string;
  monthlyPurchaseQtyKg: string;
  orderingCadence: "1_month" | "2_months";
  nextDeliveryDate: string;
  notes: string;
}

interface CalculatedValues {
  costPriceSgd: number;
  importTaxAmountSgd: number;
  totalLandedCostSgd: number;
  effectiveSellingPrice: number;
  profitPerKgSgd: number;
  profitMarginPercent: number;
  totalProfitPerMonthSgd: number;
  annualizedProfitSgd: number;
}

interface ValidationWarnings {
  hasNegativeProfit: boolean;
  hasLowMargin: boolean;
  hasInvalidInput: boolean;
  messages: string[];
}

const initialFormData: FormData = {
  clientId: null,
  skuId: null,
  supplierId: null,
  qualityTier: "standard",
  costPriceJpy: "",
  exchangeRate: DEFAULT_EXCHANGE_RATE.toString(),
  shippingFeePerKg: DEFAULT_SHIPPING_FEE.toString(),
  importTaxRate: (DEFAULT_IMPORT_TAX_RATE * 100).toString(),
  sellingPricePerKg: "",
  specialDiscountPercent: "0",
  monthlyPurchaseQtyKg: "",
  orderingCadence: "1_month",
  nextDeliveryDate: "",
  notes: "",
};

export default function ClientProductRelations() {
  const { hasPermission, currentRole } = useSecurity();
  const canEdit = hasPermission("canEditPricing");
  const canViewCosts = hasPermission("canViewCosts");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWarnings, setFilterWarnings] = useState<string>("all");

  // Fetch data
  const { data: relations, refetch: refetchRelations } = trpc.clientProductRelations?.list?.useQuery() ?? { data: [] as any[], refetch: () => {} };
  const { data: clients } = trpc.clients?.list?.useQuery() ?? { data: [] };
  const { data: products } = trpc.skus?.list?.useQuery() ?? { data: [] };
  const { data: suppliers } = trpc.suppliers?.list?.useQuery() ?? { data: [] };
  const { data: latestExchangeRate } = trpc.exchangeRates?.latest?.useQuery() ?? { data: null };

  // Mutations
  const createMutation = trpc.clientProductRelations?.create?.useMutation({
    onSuccess: () => {
      toast.success("Client-Product relation created successfully");
      setIsDialogOpen(false);
      resetForm();
      refetchRelations();
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const updateMutation = trpc.clientProductRelations?.update?.useMutation({
    onSuccess: () => {
      toast.success("Client-Product relation updated successfully");
      setIsDialogOpen(false);
      resetForm();
      refetchRelations();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const deleteMutation = trpc.clientProductRelations?.delete?.useMutation({
    onSuccess: () => {
      toast.success("Client-Product relation deleted successfully");
      refetchRelations();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  // Real-time calculations
  const calculatedValues = useMemo((): CalculatedValues => {
    const costPriceJpy = parseFloat(formData.costPriceJpy) || 0;
    const exchangeRate = parseFloat(formData.exchangeRate) || DEFAULT_EXCHANGE_RATE;
    const shippingFeePerKg = parseFloat(formData.shippingFeePerKg) || DEFAULT_SHIPPING_FEE;
    const importTaxRate = (parseFloat(formData.importTaxRate) || DEFAULT_IMPORT_TAX_RATE * 100) / 100;
    const sellingPricePerKg = parseFloat(formData.sellingPricePerKg) || 0;
    const specialDiscountPercent = parseFloat(formData.specialDiscountPercent) || 0;
    const monthlyPurchaseQtyKg = parseFloat(formData.monthlyPurchaseQtyKg) || 0;

    // Calculate cost in SGD
    const costPriceSgd = costPriceJpy * exchangeRate;

    // Calculate import tax (applied to powder cost + shipping)
    const importTaxAmountSgd = (costPriceSgd + shippingFeePerKg) * importTaxRate;

    // Calculate total landed cost
    const totalLandedCostSgd = costPriceSgd + shippingFeePerKg + importTaxAmountSgd;

    // Calculate effective selling price after discount
    const effectiveSellingPrice = sellingPricePerKg * (1 - specialDiscountPercent / 100);

    // Calculate profit per kg
    const profitPerKgSgd = effectiveSellingPrice - totalLandedCostSgd;

    // Calculate profit margin percentage
    const profitMarginPercent = effectiveSellingPrice > 0 
      ? (profitPerKgSgd / effectiveSellingPrice) * 100 
      : 0;

    // Calculate monthly and annual profit
    const totalProfitPerMonthSgd = profitPerKgSgd * monthlyPurchaseQtyKg;
    const annualizedProfitSgd = totalProfitPerMonthSgd * 12;

    return {
      costPriceSgd,
      importTaxAmountSgd,
      totalLandedCostSgd,
      effectiveSellingPrice,
      profitPerKgSgd,
      profitMarginPercent,
      totalProfitPerMonthSgd,
      annualizedProfitSgd,
    };
  }, [formData]);

  // Validation warnings
  const validationWarnings = useMemo((): ValidationWarnings => {
    const warnings: ValidationWarnings = {
      hasNegativeProfit: false,
      hasLowMargin: false,
      hasInvalidInput: false,
      messages: [],
    };

    // Check for negative profit
    if (calculatedValues.profitPerKgSgd < 0) {
      warnings.hasNegativeProfit = true;
      warnings.messages.push(`⚠️ Negative profit: $${calculatedValues.profitPerKgSgd.toFixed(2)}/kg loss`);
    }

    // Check for low margin (below 15%)
    if (calculatedValues.profitMarginPercent > 0 && calculatedValues.profitMarginPercent < 15) {
      warnings.hasLowMargin = true;
      warnings.messages.push(`⚠️ Low margin: ${calculatedValues.profitMarginPercent.toFixed(1)}% (recommended: >15%)`);
    }

    // Check for invalid inputs
    if (formData.costPriceJpy && parseFloat(formData.costPriceJpy) <= 0) {
      warnings.hasInvalidInput = true;
      warnings.messages.push("❌ Cost price must be greater than 0");
    }

    if (formData.sellingPricePerKg && parseFloat(formData.sellingPricePerKg) <= 0) {
      warnings.hasInvalidInput = true;
      warnings.messages.push("❌ Selling price must be greater than 0");
    }

    if (formData.monthlyPurchaseQtyKg && parseFloat(formData.monthlyPurchaseQtyKg) < 0) {
      warnings.hasInvalidInput = true;
      warnings.messages.push("❌ Monthly quantity cannot be negative");
    }

    return warnings;
  }, [calculatedValues, formData]);

  // Update exchange rate when latest is fetched
  useEffect(() => {
    if (latestExchangeRate && !editingId) {
      setFormData(prev => ({
        ...prev,
        exchangeRate: latestExchangeRate.rate?.toString() || DEFAULT_EXCHANGE_RATE.toString(),
      }));
    }
  }, [latestExchangeRate, editingId]);

  // Auto-populate supplier when SKU is selected
  useEffect(() => {
    if (formData.skuId && products) {
      const selectedProduct = (products as Array<{id: number; supplierId: number}>).find(p => p.id === formData.skuId);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          supplierId: selectedProduct.supplierId,
        }));
      }
    }
  }, [formData.skuId, products]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleEdit = (relation: Record<string, unknown>) => {
    setEditingId(relation.id as number);
    setFormData({
      clientId: relation.clientId as number,
      skuId: relation.skuId as number,
      supplierId: relation.supplierId as number,
      qualityTier: (relation.qualityTier as "standard" | "premium" | "seasonal") || "standard",
      costPriceJpy: relation.costPriceJpy?.toString() || "",
      exchangeRate: relation.exchangeRate?.toString() || DEFAULT_EXCHANGE_RATE.toString(),
      shippingFeePerKg: relation.shippingFeePerKg?.toString() || DEFAULT_SHIPPING_FEE.toString(),
      importTaxRate: ((parseFloat(relation.importTaxRate as string) || DEFAULT_IMPORT_TAX_RATE) * 100).toString(),
      sellingPricePerKg: relation.sellingPricePerKg?.toString() || "",
      specialDiscountPercent: relation.specialDiscountPercent?.toString() || "0",
      monthlyPurchaseQtyKg: relation.monthlyPurchaseQtyKg?.toString() || "",
      orderingCadence: (relation.orderingCadence as "1_month" | "2_months") || "1_month",
      nextDeliveryDate: relation.nextDeliveryDate ? new Date(relation.nextDeliveryDate as string).toISOString().split('T')[0] : "",
      notes: (relation.notes as string) || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.clientId || !formData.skuId || !formData.supplierId) {
      toast.error("Please select client, product, and supplier");
      return;
    }

    if (validationWarnings.hasInvalidInput) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    const payload = {
      clientId: formData.clientId,
      skuId: formData.skuId,
      supplierId: formData.supplierId,
      qualityTier: formData.qualityTier,
      costPriceJpy: formData.costPriceJpy,
      exchangeRate: formData.exchangeRate,
      shippingFeePerKg: formData.shippingFeePerKg,
      importTaxRate: (parseFloat(formData.importTaxRate) / 100).toString(),
      sellingPricePerKg: formData.sellingPricePerKg,
      specialDiscountPercent: formData.specialDiscountPercent,
      monthlyPurchaseQtyKg: formData.monthlyPurchaseQtyKg,
      orderingCadence: formData.orderingCadence,
      nextDeliveryDate: formData.nextDeliveryDate || null,
      notes: formData.notes,
      // Calculated values
      importTaxAmountSgd: calculatedValues.importTaxAmountSgd.toFixed(2),
      totalLandedCostSgd: calculatedValues.totalLandedCostSgd.toFixed(2),
      profitPerKgSgd: calculatedValues.profitPerKgSgd.toFixed(2),
      totalProfitPerMonthSgd: calculatedValues.totalProfitPerMonthSgd.toFixed(2),
      annualizedProfitSgd: calculatedValues.annualizedProfitSgd.toFixed(2),
      hasNegativeProfit: validationWarnings.hasNegativeProfit,
    };

    if (editingId) {
      updateMutation?.mutate({ id: editingId, ...payload });
    } else {
      createMutation?.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this client-product relation?")) {
      deleteMutation?.mutate({ id });
    }
  };

  // Filter relations
  const filteredRelations = useMemo(() => {
    if (!relations) return [];
    
    return (relations as Array<Record<string, unknown>>).filter(relation => {
      // Search filter
      const clientName = (relation.clientName as string)?.toLowerCase() || "";
      const skuName = (relation.skuName as string)?.toLowerCase() || "";
      const supplierName = (relation.supplierName as string)?.toLowerCase() || "";
      const matchesSearch = searchTerm === "" || 
        clientName.includes(searchTerm.toLowerCase()) ||
        skuName.includes(searchTerm.toLowerCase()) ||
        supplierName.includes(searchTerm.toLowerCase());

      // Warning filter
      let matchesWarning = true;
      if (filterWarnings === "negative_profit") {
        matchesWarning = relation.hasNegativeProfit === true;
      } else if (filterWarnings === "insufficient_inventory") {
        matchesWarning = relation.hasInsufficientInventory === true;
      } else if (filterWarnings === "missed_reorder") {
        matchesWarning = relation.hasMissedReorderWindow === true;
      }

      return matchesSearch && matchesWarning;
    });
  }, [relations, searchTerm, filterWarnings]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (!relations || (relations as Array<Record<string, unknown>>).length === 0) {
      return {
        totalMonthlyProfit: 0,
        totalAnnualProfit: 0,
        avgMargin: 0,
        warningCount: 0,
      };
    }

    const relationsList = relations as Array<Record<string, unknown>>;
    const totalMonthlyProfit = relationsList.reduce((sum, r) => sum + (parseFloat(r.totalProfitPerMonthSgd as string) || 0), 0);
    const totalAnnualProfit = relationsList.reduce((sum, r) => sum + (parseFloat(r.annualizedProfitSgd as string) || 0), 0);
    
    const margins = relationsList
      .filter(r => parseFloat(r.sellingPricePerKg as string) > 0)
      .map(r => {
        const selling = parseFloat(r.sellingPricePerKg as string);
        const landed = parseFloat(r.totalLandedCostSgd as string);
        return ((selling - landed) / selling) * 100;
      });
    const avgMargin = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;
    
    const warningCount = relationsList.filter(r => 
      r.hasNegativeProfit || r.hasInsufficientInventory || r.hasMissedReorderWindow
    ).length;

    return { totalMonthlyProfit, totalAnnualProfit, avgMargin, warningCount };
  }, [relations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client-Product Relations</h1>
          <p className="text-muted-foreground">
            Canonical data layer for profitability analysis and demand forecasting
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Relation
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {canViewCosts ? (
                <SensitiveValue value={`$${summaryStats.totalMonthlyProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              ) : (
                <span className="text-muted-foreground">Restricted</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">SGD per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Profit</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {canViewCosts ? (
                <SensitiveValue value={`$${summaryStats.totalAnnualProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              ) : (
                <span className="text-muted-foreground">Restricted</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Projected SGD per year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {canViewCosts ? (
                <span className={summaryStats.avgMargin < 15 ? "text-yellow-500" : "text-green-500"}>
                  {summaryStats.avgMargin.toFixed(1)}%
                </span>
              ) : (
                <span className="text-muted-foreground">Restricted</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Across all relations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={summaryStats.warningCount > 0 ? "text-red-500" : "text-green-500"}>
                {summaryStats.warningCount}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Issues requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by client, product, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterWarnings} onValueChange={setFilterWarnings}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by warnings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Relations</SelectItem>
                <SelectItem value="negative_profit">Negative Profit</SelectItem>
                <SelectItem value="insufficient_inventory">Insufficient Inventory</SelectItem>
                <SelectItem value="missed_reorder">Missed Reorder</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetchRelations()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Product (SKU)</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Quality</TableHead>
                  {canViewCosts && <TableHead className="text-right">Cost (JPY)</TableHead>}
                  {canViewCosts && <TableHead className="text-right">Landed Cost</TableHead>}
                  <TableHead className="text-right">Selling Price</TableHead>
                  {canViewCosts && <TableHead className="text-right">Profit/kg</TableHead>}
                  <TableHead className="text-right">Monthly Qty</TableHead>
                  {canViewCosts && <TableHead className="text-right">Monthly Profit</TableHead>}
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRelations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canViewCosts ? 12 : 7} className="text-center py-8 text-muted-foreground">
                      No client-product relations found. Click "Add Relation" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRelations.map((relation) => (
                    <TableRow key={relation.id as number} className={relation.hasNegativeProfit ? "bg-red-50 dark:bg-red-950/20" : ""}>
                      <TableCell className="font-medium">{relation.clientName as string}</TableCell>
                      <TableCell>{relation.skuName as string}</TableCell>
                      <TableCell>{relation.supplierName as string}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {relation.qualityTier as string}
                        </Badge>
                      </TableCell>
                      {canViewCosts && (
                        <TableCell className="text-right">
                          <SensitiveValue value={`¥${parseFloat(relation.costPriceJpy as string).toLocaleString()}`} />
                        </TableCell>
                      )}
                      {canViewCosts && (
                        <TableCell className="text-right">
                          <SensitiveValue value={`$${parseFloat(relation.totalLandedCostSgd as string).toFixed(2)}`} />
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        ${parseFloat(relation.sellingPricePerKg as string).toFixed(2)}
                      </TableCell>
                      {canViewCosts && (
                        <TableCell className="text-right">
                          <span className={parseFloat(relation.profitPerKgSgd as string) < 0 ? "text-red-500 font-semibold" : "text-green-600"}>
                            <SensitiveValue value={`$${parseFloat(relation.profitPerKgSgd as string).toFixed(2)}`} />
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        {parseFloat(relation.monthlyPurchaseQtyKg as string).toFixed(1)} kg
                      </TableCell>
                      {canViewCosts && (
                        <TableCell className="text-right">
                          <span className={parseFloat(relation.totalProfitPerMonthSgd as string) < 0 ? "text-red-500 font-semibold" : "text-green-600"}>
                            <SensitiveValue value={`$${parseFloat(relation.totalProfitPerMonthSgd as string).toFixed(2)}`} />
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex gap-1">
                          {Boolean(relation.hasNegativeProfit) && (
                            <Badge variant="destructive" className="gap-1">
                              <TrendingDown className="h-3 w-3" />
                              Loss
                            </Badge>
                          )}
                          {Boolean(relation.hasInsufficientInventory) && (
                            <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
                              <AlertCircle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          )}
                          {Boolean(relation.hasMissedReorderWindow) && (
                            <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
                              <Clock className="h-3 w-3" />
                              Reorder
                            </Badge>
                          )}
                          {!relation.hasNegativeProfit && !relation.hasInsufficientInventory && !relation.hasMissedReorderWindow && (
                            <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3" />
                              OK
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(relation)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(relation.id as number)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Client-Product Relation</DialogTitle>
            <DialogDescription>
              Configure pricing, volume, and logistics for a client-product combination.
              All calculations update in real-time.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="client-product" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="client-product">Client & Product</TabsTrigger>
              <TabsTrigger value="cost-pricing">Cost & Pricing</TabsTrigger>
              <TabsTrigger value="volume">Volume & Profit</TabsTrigger>
              <TabsTrigger value="logistics">Logistics</TabsTrigger>
            </TabsList>

            {/* Tab A: Client & Product Information */}
            <TabsContent value="client-product" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client Name *</Label>
                  <Select
                    value={formData.clientId?.toString() || ""}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {(clients as Array<{id: number; name: string}> || []).map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skuId">Matcha Product (SKU) *</Label>
                  <Select
                    value={formData.skuId?.toString() || ""}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, skuId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {(products as Array<{id: number; name: string}> || []).map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier *</Label>
                  <Select
                    value={formData.supplierId?.toString() || ""}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {(suppliers as Array<{id: number; name: string}> || []).map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualityTier">Quality Tier</Label>
                  <Select
                    value={formData.qualityTier}
                    onValueChange={(value: "standard" | "premium" | "seasonal") => 
                      setFormData(prev => ({ ...prev, qualityTier: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Tab B: Cost & Pricing Inputs */}
            <TabsContent value="cost-pricing" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="costPriceJpy">Cost Price per kg (JPY) *</Label>
                  <Input
                    id="costPriceJpy"
                    type="number"
                    placeholder="e.g., 15000"
                    value={formData.costPriceJpy}
                    onChange={(e) => setFormData(prev => ({ ...prev, costPriceJpy: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exchangeRate">Exchange Rate (JPY → SGD)</Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    step="0.0001"
                    placeholder="e.g., 0.0091"
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, exchangeRate: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current: 1 JPY = {formData.exchangeRate} SGD
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingFeePerKg">Shipping Fee per kg (SGD)</Label>
                  <Input
                    id="shippingFeePerKg"
                    type="number"
                    step="0.01"
                    placeholder="Default: 15.00"
                    value={formData.shippingFeePerKg}
                    onChange={(e) => setFormData(prev => ({ ...prev, shippingFeePerKg: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="importTaxRate">Import Tax Rate (%)</Label>
                  <Input
                    id="importTaxRate"
                    type="number"
                    step="0.1"
                    placeholder="Default: 9"
                    value={formData.importTaxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, importTaxRate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellingPricePerKg">Selling Price per kg (SGD) *</Label>
                  <Input
                    id="sellingPricePerKg"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 250.00"
                    value={formData.sellingPricePerKg}
                    onChange={(e) => setFormData(prev => ({ ...prev, sellingPricePerKg: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialDiscountPercent">Special Client Discount (%)</Label>
                  <Input
                    id="specialDiscountPercent"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 5"
                    value={formData.specialDiscountPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialDiscountPercent: e.target.value }))}
                  />
                </div>
              </div>

              {/* Real-time Calculated Values */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Real-time Calculations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost in SGD:</span>
                      <span className="font-medium">${calculatedValues.costPriceSgd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Import Tax Amount:</span>
                      <span className="font-medium">${calculatedValues.importTaxAmountSgd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground font-semibold">Total Landed Cost:</span>
                      <span className="font-bold">${calculatedValues.totalLandedCostSgd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Effective Selling Price:</span>
                      <span className="font-medium">${calculatedValues.effectiveSellingPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Profit per kg:</span>
                      <span className={`font-bold ${calculatedValues.profitPerKgSgd < 0 ? 'text-red-500' : 'text-green-600'}`}>
                        ${calculatedValues.profitPerKgSgd.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit Margin:</span>
                      <span className={`font-medium ${calculatedValues.profitMarginPercent < 15 ? 'text-yellow-500' : 'text-green-600'}`}>
                        {calculatedValues.profitMarginPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab C: Volume & Profitability */}
            <TabsContent value="volume" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monthlyPurchaseQtyKg">Monthly Purchase Quantity (kg) *</Label>
                  <Input
                    id="monthlyPurchaseQtyKg"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 50"
                    value={formData.monthlyPurchaseQtyKg}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyPurchaseQtyKg: e.target.value }))}
                  />
                </div>
              </div>

              {/* Profitability Summary */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Profitability Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-background">
                      <p className="text-sm text-muted-foreground">Total Profit per Month</p>
                      <p className={`text-2xl font-bold ${calculatedValues.totalProfitPerMonthSgd < 0 ? 'text-red-500' : 'text-green-600'}`}>
                        ${calculatedValues.totalProfitPerMonthSgd.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">SGD</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background">
                      <p className="text-sm text-muted-foreground">Annualized Profit</p>
                      <p className={`text-2xl font-bold ${calculatedValues.annualizedProfitSgd < 0 ? 'text-red-500' : 'text-green-600'}`}>
                        ${calculatedValues.annualizedProfitSgd.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">SGD (Monthly × 12)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab E: Ordering & Logistics Timeline */}
            <TabsContent value="logistics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orderingCadence">Ordering Cadence</Label>
                  <Select
                    value={formData.orderingCadence}
                    onValueChange={(value: "1_month" | "2_months") => 
                      setFormData(prev => ({ ...prev, orderingCadence: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_month">Every 1 Month</SelectItem>
                      <SelectItem value="2_months">Every 2 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextDeliveryDate">Next Delivery Date (Client)</Label>
                  <Input
                    id="nextDeliveryDate"
                    type="date"
                    value={formData.nextDeliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextDeliveryDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Additional notes about this client-product relation"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Validation Warnings */}
          {validationWarnings.messages.length > 0 && (
            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">Validation Warnings</p>
                    <ul className="mt-1 text-sm text-yellow-600 dark:text-yellow-300">
                      {validationWarnings.messages.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={validationWarnings.hasInvalidInput || createMutation?.isPending || updateMutation?.isPending}
            >
              {createMutation?.isPending || updateMutation?.isPending ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
