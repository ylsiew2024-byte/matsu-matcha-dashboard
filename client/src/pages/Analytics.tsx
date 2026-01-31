import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package,
  Users,
  Truck,
  AlertTriangle,
  Download,
  Lock
} from "lucide-react";
import { useSecurity } from "@/contexts/SecurityContext";
import { useSecureExport } from "@/components/ExportConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'];

export default function Analytics() {
  const { hasPermission, isPanicMode } = useSecurity();
  const { triggerExport } = useSecureExport();
  const canViewMargins = hasPermission('canViewMargins');
  const shouldBlur = isPanicMode || !canViewMargins;
  const canExport = hasPermission('canExportData');
  
  const { data: profitability, isLoading: loadingProfit } = trpc.analytics.skuProfitability.useQuery();
  const { data: supplierPerf, isLoading: loadingSupplier } = trpc.analytics.skuProfitability.useQuery();
  const { data: clientContrib, isLoading: loadingClient } = trpc.analytics.clientProfitability.useQuery();
  const { data: forecast, isLoading: loadingForecast } = trpc.forecasts.list.useQuery({});
  const { data: orders } = trpc.clientOrders.list.useQuery({});
  const { data: skus } = trpc.skus.list.useQuery({});
  const { data: suppliers } = trpc.suppliers.list.useQuery({});
  const { data: clients } = trpc.clients.list.useQuery({});

  const isLoading = loadingProfit || loadingSupplier || loadingClient || loadingForecast;

  // Calculate monthly revenue trend (mock data for visualization)
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
      month,
      revenue: Math.floor(Math.random() * 5000 + 3000 + i * 500),
      orders: Math.floor(Math.random() * 20 + 10 + i * 2),
    }));
  }, []);

  // Calculate profit margin for each product
  const profitabilityWithMargin = useMemo(() => {
    if (!profitability) return [];
    return profitability.map((p: any) => ({
      ...p,
      profitMargin: p.totalRevenue > 0 ? (p.totalProfit / p.totalRevenue * 100) : 0,
      profitPerKg: p.totalQuantity > 0 ? (p.totalProfit / p.totalQuantity) : 0,
    }));
  }, [profitability]);

  // Calculate top performing products
  const topProducts = useMemo(() => {
    if (!profitabilityWithMargin) return [];
    return [...profitabilityWithMargin]
      .sort((a, b) => Number(b.profitMargin) - Number(a.profitMargin))
      .slice(0, 5);
  }, [profitabilityWithMargin]);

  // Calculate low margin products
  const lowMarginProducts = useMemo(() => {
    if (!profitabilityWithMargin) return [];
    return [...profitabilityWithMargin]
      .filter((p: any) => Number(p.profitMargin) < 20)
      .sort((a, b) => Number(a.profitMargin) - Number(b.profitMargin));
  }, [profitabilityWithMargin]);

  // Supplier distribution data
  const supplierData = useMemo(() => {
    if (!suppliers || !skus) return [];
    const supplierSkuCount: Record<number, { name: string; count: number }> = {};
    skus.forEach((sku: any) => {
      if (sku.supplierId) {
        if (!supplierSkuCount[sku.supplierId]) {
          const supplier = suppliers.find((s: any) => s.id === sku.supplierId);
          supplierSkuCount[sku.supplierId] = { name: supplier?.name || `Supplier ${sku.supplierId}`, count: 0 };
        }
        supplierSkuCount[sku.supplierId].count++;
      }
    });
    return Object.values(supplierSkuCount).map(s => ({ name: s.name, value: s.count }));
  }, [suppliers, skus]);

  const getSkuName = (skuId: number) => {
    return skus?.find(s => s.id === skuId)?.name || `SKU #${skuId}`;
  };

  const getClientName = (clientId: number) => {
    return clients?.find(c => c.id === clientId)?.name || `Client #${clientId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-semibold">Analytics Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Business insights and performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Avg. Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProfit ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">
                  {profitability && profitability.length > 0
                    ? (profitability.reduce((sum: number, p: any) => sum + Number(p.profitMargin), 0) / profitability.length).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">across all products</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skus?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{profitability?.length || 0} priced</p>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients?.length || 0}</div>
            <p className="text-xs text-muted-foreground">B2B customers</p>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Japanese sources</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Monthly revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Distribution */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Supplier Distribution
            </CardTitle>
            <CardDescription>Products by supplier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {supplierData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supplierData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {supplierData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No supplier data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profitability Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performing Products */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Performing Products
            </CardTitle>
            <CardDescription>Highest margin products</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProfit ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No profitability data</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Profit/kg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((item) => (
                    <TableRow key={item.skuId}>
                      <TableCell className="font-medium">{getSkuName(item.skuId)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="font-mono">
                          {Number(item.profitMargin).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-primary">
                        ${Number(item.profitPerKg).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Low Margin Alert */}
        <Card className={`card-elegant ${lowMarginProducts.length > 0 ? 'border-warning/50' : ''}`}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${lowMarginProducts.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
              Low Margin Products
            </CardTitle>
            <CardDescription>Products below 20% margin</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProfit ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : lowMarginProducts.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-primary/50 mb-3" />
                <p className="text-muted-foreground">All products have healthy margins</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowMarginProducts.map((item) => (
                    <TableRow key={item.skuId}>
                      <TableCell className="font-medium">{getSkuName(item.skuId)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-mono text-warning border-warning/50">
                          {Number(item.profitMargin).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-xs">
                          Review pricing
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Contribution */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Client Contribution Analysis
          </CardTitle>
          <CardDescription>Revenue and order distribution by client</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingClient ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !clientContrib || clientContrib.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No client data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Quantity</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Contribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientContrib.map((client: any) => {
                  const totalRevenue = clientContrib.reduce((sum: number, c: any) => sum + Number(c.totalRevenue), 0);
                  const contribution = totalRevenue > 0 ? (Number(client.totalRevenue) / totalRevenue * 100) : 0;
                  
                  return (
                    <TableRow key={client.clientId}>
                      <TableCell className="font-medium">{getClientName(client.clientId)}</TableCell>
                      <TableCell className="text-right">{client.orderCount}</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(client.totalQuantityKg).toFixed(2)} kg
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        SGD {Number(client.totalRevenue).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={contribution >= 20 ? "default" : "outline"}>
                          {contribution.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Demand Forecast */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Demand Forecast
          </CardTitle>
          <CardDescription>Projected demand and reorder suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingForecast ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !forecast || forecast.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Insufficient data for forecasting. More order history needed.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Avg. Monthly</TableHead>
                  <TableHead className="text-right">Projected</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-center">Reorder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecast.map((item: any) => (
                  <TableRow key={item.skuId}>
                    <TableCell className="font-medium">{getSkuName(item.skuId)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(item.avgMonthlyDemand).toFixed(2)} kg
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(item.projectedDemand).toFixed(2)} kg
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(item.currentStock).toFixed(2)} kg
                    </TableCell>
                    <TableCell className="text-center">
                      {item.reorderSuggested ? (
                        <Badge variant="destructive">Reorder Now</Badge>
                      ) : (
                        <Badge variant="outline" className="text-primary">OK</Badge>
                      )}
                    </TableCell>
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
