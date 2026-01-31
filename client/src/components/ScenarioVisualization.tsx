import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calculator,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";

// Color palette for charts
const COLORS = {
  primary: "oklch(0.55 0.15 145)",
  secondary: "oklch(0.65 0.12 145)",
  accent: "oklch(0.75 0.10 145)",
  warning: "oklch(0.75 0.15 60)",
  danger: "oklch(0.65 0.20 25)",
  success: "oklch(0.65 0.15 145)",
  muted: "oklch(0.70 0.02 145)",
};

const CHART_COLORS = ["#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534"];

interface ScenarioData {
  type: "pricing" | "margin" | "inventory" | "comparison" | "forecast" | "breakdown";
  title: string;
  description?: string;
  data: any;
  insights?: string[];
  recommendations?: string[];
}

interface PricingScenarioProps {
  currentPrice: number;
  currentMargin: number;
  currentVolume: number;
  productName: string;
  currency?: string;
}

export function PricingScenarioChart({
  currentPrice,
  currentMargin,
  currentVolume,
  productName,
  currency = "USD",
}: PricingScenarioProps) {
  const [priceChange, setPriceChange] = useState(0);

  const scenarioData = useMemo(() => {
    const scenarios = [];
    for (let change = -20; change <= 30; change += 5) {
      const newPrice = currentPrice * (1 + change / 100);
      // Assume elasticity: 10% price increase = 5% volume decrease
      const elasticity = -0.5;
      const volumeChange = change * elasticity;
      const newVolume = currentVolume * (1 + volumeChange / 100);
      const newRevenue = newPrice * newVolume;
      const currentRevenue = currentPrice * currentVolume;
      const revenueChange = ((newRevenue - currentRevenue) / currentRevenue) * 100;
      
      // Margin calculation
      const costPerUnit = currentPrice * (1 - currentMargin / 100);
      const newMargin = ((newPrice - costPerUnit) / newPrice) * 100;
      const profit = (newPrice - costPerUnit) * newVolume;
      const currentProfit = (currentPrice - costPerUnit) * currentVolume;
      const profitChange = ((profit - currentProfit) / currentProfit) * 100;

      scenarios.push({
        priceChange: `${change > 0 ? "+" : ""}${change}%`,
        price: newPrice,
        volume: newVolume,
        revenue: newRevenue,
        margin: newMargin,
        profit: profit,
        revenueChange: revenueChange,
        profitChange: profitChange,
        isSelected: change === priceChange,
      });
    }
    return scenarios;
  }, [currentPrice, currentMargin, currentVolume, priceChange]);

  const selectedScenario = scenarioData.find((s) => s.priceChange === `${priceChange > 0 ? "+" : ""}${priceChange}%`);
  const costPerUnit = currentPrice * (1 - currentMargin / 100);

  return (
    <Card className="w-full bg-card/50 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Pricing Scenario Analysis: {productName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Interactive Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price Adjustment</span>
            <Badge variant={priceChange > 0 ? "default" : priceChange < 0 ? "destructive" : "secondary"}>
              {priceChange > 0 ? "+" : ""}{priceChange}%
            </Badge>
          </div>
          <Slider
            value={[priceChange]}
            onValueChange={(v) => setPriceChange(v[0])}
            min={-20}
            max={30}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-20%</span>
            <span>Current</span>
            <span>+30%</span>
          </div>
        </div>

        {/* Impact Summary */}
        {selectedScenario && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">New Price</p>
              <p className="text-lg font-semibold">{currency} {selectedScenario.price.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">from {currency} {currentPrice.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">New Margin</p>
              <p className="text-lg font-semibold">{selectedScenario.margin.toFixed(1)}%</p>
              <p className={`text-xs ${selectedScenario.margin > currentMargin ? "text-green-500" : "text-red-500"}`}>
                {selectedScenario.margin > currentMargin ? "+" : ""}{(selectedScenario.margin - currentMargin).toFixed(1)}pp
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Est. Volume</p>
              <p className="text-lg font-semibold">{selectedScenario.volume.toFixed(0)}</p>
              <p className={`text-xs ${selectedScenario.volume >= currentVolume ? "text-green-500" : "text-red-500"}`}>
                {((selectedScenario.volume - currentVolume) / currentVolume * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Profit Impact</p>
              <p className={`text-lg font-semibold ${selectedScenario.profitChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                {selectedScenario.profitChange >= 0 ? "+" : ""}{selectedScenario.profitChange.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {currency} {selectedScenario.profit.toFixed(0)}
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 145)" />
              <XAxis dataKey="priceChange" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.15 0.02 145)",
                  border: "1px solid oklch(0.3 0.02 145)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="profit" name="Profit" fill="oklch(0.55 0.15 145)" opacity={0.7} />
              <Line yAxisId="right" type="monotone" dataKey="margin" name="Margin %" stroke="oklch(0.65 0.20 60)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">AI Insight</p>
              <p className="text-muted-foreground mt-1">
                {priceChange > 0 
                  ? `A ${priceChange}% price increase would improve margins to ${selectedScenario?.margin.toFixed(1)}%, but may reduce volume by approximately ${Math.abs((selectedScenario?.volume || 0) - currentVolume) / currentVolume * 100}%. Net profit impact: ${selectedScenario?.profitChange.toFixed(1)}%.`
                  : priceChange < 0
                  ? `A ${Math.abs(priceChange)}% price decrease could increase volume but would reduce margins to ${selectedScenario?.margin.toFixed(1)}%. Consider if the volume gain justifies the margin compression.`
                  : "Current pricing maintains your baseline margin and volume. Explore adjustments to optimize profitability."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MarginComparisonProps {
  products: Array<{
    name: string;
    currentMargin: number;
    suggestedMargin: number;
    revenue: number;
  }>;
}

export function MarginComparisonChart({ products }: MarginComparisonProps) {
  const data = products.map((p) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
    fullName: p.name,
    current: p.currentMargin,
    suggested: p.suggestedMargin,
    improvement: p.suggestedMargin - p.currentMargin,
    revenue: p.revenue,
  }));

  const totalImprovement = data.reduce((sum, d) => sum + d.improvement, 0) / data.length;

  return (
    <Card className="w-full bg-card/50 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Margin Improvement Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <TrendingUp className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-sm text-muted-foreground">Average Margin Improvement Potential</p>
            <p className="text-2xl font-bold text-green-500">+{totalImprovement.toFixed(1)}%</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 145)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.15 0.02 145)",
                  border: "1px solid oklch(0.3 0.02 145)",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
              />
              <Legend />
              <Bar dataKey="current" name="Current Margin" fill="oklch(0.5 0.05 145)" />
              <Bar dataKey="suggested" name="Suggested Margin" fill="oklch(0.55 0.15 145)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {data.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
              <span className="text-sm">{item.fullName}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{item.current.toFixed(1)}%</span>
                <ArrowRight className="h-3 w-3 text-primary" />
                <Badge variant="default" className="bg-green-500">
                  {item.suggested.toFixed(1)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface InventoryForecastProps {
  data: Array<{
    month: string;
    actual?: number;
    forecast: number;
    reorderPoint: number;
  }>;
  productName: string;
  unit?: string;
}

export function InventoryForecastChart({ data, productName, unit = "kg" }: InventoryForecastProps) {
  const criticalMonth = data.find((d) => d.forecast < d.reorderPoint);

  return (
    <Card className="w-full bg-card/50 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Inventory Forecast: {productName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {criticalMonth && (
          <div className="flex items-center gap-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Package className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-500">Reorder Alert</p>
              <p className="text-sm text-muted-foreground">
                Stock projected to fall below reorder point in {criticalMonth.month}
              </p>
            </div>
          </div>
        )}

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 145)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" />
              <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.15 0.02 145)",
                  border: "1px solid oklch(0.3 0.02 145)",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value} ${unit}`, ""]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Stock"
                stroke="oklch(0.55 0.15 145)"
                fill="oklch(0.55 0.15 145)"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="forecast"
                name="Forecasted Stock"
                stroke="oklch(0.65 0.12 145)"
                fill="oklch(0.65 0.12 145)"
                fillOpacity={0.2}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="reorderPoint"
                name="Reorder Point"
                stroke="oklch(0.65 0.20 25)"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProfitBreakdownProps {
  data: Array<{
    category: string;
    value: number;
    percentage: number;
  }>;
  title?: string;
  total: number;
  currency?: string;
}

export function ProfitBreakdownChart({ data, title = "Profit Breakdown", total, currency = "USD" }: ProfitBreakdownProps) {
  return (
    <Card className="w-full bg-card/50 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-3xl font-bold">{currency} {total.toLocaleString()}</p>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percentage }) => `${percentage.toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.15 0.02 145)",
                  border: "1px solid oklch(0.3 0.02 145)",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-sm">{item.category}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium">{currency} {item.value.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground ml-2">({item.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main component that renders the appropriate visualization based on scenario type
interface ScenarioVisualizationProps {
  scenario: ScenarioData;
}

export function ScenarioVisualization({ scenario }: ScenarioVisualizationProps) {
  switch (scenario.type) {
    case "pricing":
      return (
        <PricingScenarioChart
          currentPrice={scenario.data.currentPrice || 100}
          currentMargin={scenario.data.currentMargin || 30}
          currentVolume={scenario.data.currentVolume || 1000}
          productName={scenario.data.productName || "Product"}
          currency={scenario.data.currency}
        />
      );
    case "margin":
      return <MarginComparisonChart products={scenario.data.products || []} />;
    case "forecast":
      return (
        <InventoryForecastChart
          data={scenario.data.forecastData || []}
          productName={scenario.data.productName || "Product"}
          unit={scenario.data.unit}
        />
      );
    case "breakdown":
      return (
        <ProfitBreakdownChart
          data={scenario.data.breakdown || []}
          title={scenario.title}
          total={scenario.data.total || 0}
          currency={scenario.data.currency}
        />
      );
    default:
      return null;
  }
}

export default ScenarioVisualization;
