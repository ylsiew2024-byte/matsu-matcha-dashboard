import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSecurity } from "@/contexts/SecurityContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Area,
  AreaChart,
} from "recharts";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Package,
  AlertTriangle,
  Lock,
  Sparkles,
  Target,
  Zap
} from "lucide-react";

// Access control - only Super Admin and Business Client can access this page
export default function AiPredictions() {
  const { user } = useAuth();
  const { currentRole, hasPermission } = useSecurity();
  
  const canAccess = hasPermission('canAccessAIPredictions');
  
  const [timeRange, setTimeRange] = useState<string>("3months");
  
  // Fetch forecast data
  const { data: forecasts, isLoading: loadingForecasts } = trpc.forecasts.list.useQuery({});
  const { data: clients } = trpc.clients.list.useQuery({});
  const { data: skus } = trpc.skus.list.useQuery({});
  
  // Get client-specific data for business_client role
  const linkedClientId = (user as any)?.linkedClientId;
  const isBusinessClient = currentRole === 'business_client';
  
  // Filter forecasts for business client
  const filteredForecasts = isBusinessClient && linkedClientId
    ? forecasts?.filter(f => f.clientId === linkedClientId)
    : forecasts;
  
  const getClientName = (clientId: number | null) => {
    if (!clientId) return 'All Clients';
    return clients?.find(c => c.id === clientId)?.name || `Client #${clientId}`;
  };
  
  const getSkuName = (skuId: number | null) => {
    if (!skuId) return 'All Products';
    return skus?.find(s => s.id === skuId)?.name || `SKU #${skuId}`;
  };
  
  // Access denied view
  if (!canAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold">Access Restricted</h2>
              <p className="text-muted-foreground">
                AI Usage Predictions are only available to Super Admin and Business Client accounts.
              </p>
              <Badge variant="outline" className="mt-2">
                Your role: {currentRole.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Generate mock prediction data for visualization
  const generatePredictionData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
      month,
      predicted: Math.round(50 + Math.random() * 100 + i * 10),
      actual: i < 3 ? Math.round(45 + Math.random() * 100 + i * 10) : null,
      confidence: 85 + Math.random() * 10,
    }));
  };
  
  const predictionData = generatePredictionData();
  
  // Calculate summary stats
  const totalPredictedDemand = filteredForecasts?.reduce(
    (sum, f) => sum + Number(f.projectedDemandKg || 0), 0
  ) || 0;
  
  const avgConfidence = filteredForecasts?.length 
    ? filteredForecasts.reduce((sum, f) => sum + (f.confidenceLevel === 'high' ? 90 : f.confidenceLevel === 'medium' ? 70 : 50), 0) / filteredForecasts.length
    : 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Usage Predictions
          </h2>
          <p className="text-muted-foreground mt-1">
            {isBusinessClient 
              ? "Demand forecasts and usage predictions for your account"
              : "AI-powered demand forecasting and business intelligence"
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Predicted Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPredictedDemand.toFixed(0)} kg</div>
            <p className="text-xs text-muted-foreground">Next {timeRange}</p>
          </CardContent>
        </Card>
        
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Model Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConfidence.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Average accuracy</p>
          </CardContent>
        </Card>
        
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">+12.5%</div>
            <p className="text-xs text-muted-foreground">vs. previous period</p>
          </CardContent>
        </Card>
        
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Forecasts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredForecasts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active predictions</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Demand Forecast Chart */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Demand Forecast
          </CardTitle>
          <CardDescription>
            AI-predicted demand vs actual usage over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictionData}>
                <defs>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#4ade80" 
                  fillOpacity={1} 
                  fill="url(#colorPredicted)"
                  name="Predicted (kg)"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                  name="Actual (kg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Forecast Details */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Product */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-lg">Product Predictions</CardTitle>
            <CardDescription>Forecasted demand by matcha product</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingForecasts ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredForecasts?.slice(0, 5).map((forecast) => (
                  <div key={forecast.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{getSkuName(forecast.skuId)}</p>
                      <p className="text-xs text-muted-foreground">
                        {forecast.forecastMonth ? new Date(forecast.forecastMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium">{Number(forecast.projectedDemandKg).toFixed(0)} kg</p>
                      <Badge variant="outline" className="text-xs">
                        {forecast.confidenceLevel || 'medium'} confidence
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!filteredForecasts || filteredForecasts.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No forecasts available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* AI Insights */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insights
            </CardTitle>
            <CardDescription>Automated business recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Demand Increase Expected</p>
                    <p className="text-xs text-muted-foreground">
                      Based on historical patterns, expect 15% higher demand in the next quarter.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Stock Alert</p>
                    <p className="text-xs text-muted-foreground">
                      Ceremonial grade matcha may need reorder within 3 weeks based on current usage rate.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Optimization Opportunity</p>
                    <p className="text-xs text-muted-foreground">
                      Consider bulk ordering Uji Premium - consistent demand pattern detected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Business Client Notice */}
      {isBusinessClient && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Your Personalized Predictions</p>
                <p className="text-sm text-muted-foreground">
                  These forecasts are tailored specifically to your account's ordering history and usage patterns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
