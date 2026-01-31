import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Bot, Sparkles, TrendingUp, TrendingDown, Package, Users, 
  DollarSign, AlertTriangle, CheckCircle2, ArrowRight, 
  RefreshCw, Clock, Target, Lightbulb, Zap, ShoppingCart,
  BarChart3, Play, Pause, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

interface SmartAction {
  id: string;
  title: string;
  description: string;
  type: "auto" | "manual";
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
}

interface DailyInsight {
  title: string;
  value: string | number;
  change?: number;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
}

export function AISmartDashboard() {
  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [runningActions, setRunningActions] = useState<Set<string>>(new Set());

  // Fetch all business data
  const { data: clients } = trpc.clients.list.useQuery({});
  const { data: suppliers } = trpc.suppliers.list.useQuery({});
  const { data: skus } = trpc.skus.list.useQuery({});
  const { data: inventory } = trpc.inventory.list.useQuery();
  const { data: lowStock } = trpc.inventory.lowStock.useQuery();
  const { data: orders } = trpc.clientOrders.list.useQuery({});
  const { data: pricing } = trpc.pricing.current.useQuery();

  // AI mutations
  const generateBriefing = trpc.ai.contextChat.useMutation();
  const bulkRecommendations = trpc.ai.bulkRecommendations.useMutation();

  // Calculate insights
  const insights: DailyInsight[] = [
    {
      title: "Active Clients",
      value: clients?.length || 0,
      trend: "neutral",
      icon: Users,
    },
    {
      title: "Products",
      value: skus?.length || 0,
      trend: "neutral",
      icon: Package,
    },
    {
      title: "Low Stock Items",
      value: lowStock?.length || 0,
      trend: lowStock && lowStock.length > 0 ? "down" : "up",
      icon: AlertTriangle,
    },
    {
      title: "Pending Orders",
      value: orders?.filter((o: any) => o.status === "pending").length || 0,
      trend: "neutral",
      icon: ShoppingCart,
    },
  ];

  // Generate daily AI briefing
  const handleGenerateBriefing = async () => {
    setIsLoadingBriefing(true);
    try {
      const businessData = {
        clients: clients?.length || 0,
        suppliers: suppliers?.length || 0,
        products: skus?.length || 0,
        lowStockItems: lowStock?.length || 0,
        pendingOrders: orders?.filter((o: any) => o.status === "pending").length || 0,
        totalOrders: orders?.length || 0,
      };

      const result = await generateBriefing.mutateAsync({
        context: "analytics",
        message: `Generate a brief daily business summary. Current stats: ${JSON.stringify(businessData)}. Highlight key actions needed and opportunities. Keep it concise (3-4 bullet points).`,
        contextData: businessData,
      });

      setDailyBriefing(result.response);
    } catch (error) {
      toast.error("Failed to generate briefing");
    } finally {
      setIsLoadingBriefing(false);
    }
  };

  // Auto-run actions
  const smartActions = [
    {
      id: "check_inventory",
      title: "Check Inventory Levels",
      description: "Automatically monitor stock levels",
      condition: () => lowStock && lowStock.length > 0,
      action: "inventory_reorder",
    },
    {
      id: "process_orders",
      title: "Process Pending Orders",
      description: "Review and process new orders",
      condition: () => orders?.some((o: any) => o.status === "pending"),
      action: "order_processing",
    },
    {
      id: "optimize_pricing",
      title: "Review Pricing",
      description: "Check for pricing optimization opportunities",
      condition: () => pricing && pricing.length > 0,
      action: "pricing_optimization",
    },
  ];

  const handleRunAction = async (actionId: string, actionType: string) => {
    setRunningActions(prev => new Set(prev).add(actionId));
    try {
      await bulkRecommendations.mutateAsync({ type: actionType });
      toast.success(`${actionId} completed successfully`);
    } catch (error) {
      toast.error(`Failed to run ${actionId}`);
    } finally {
      setRunningActions(prev => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  };

  // Auto-generate briefing on mount
  useEffect(() => {
    if (!dailyBriefing && clients !== undefined) {
      handleGenerateBriefing();
    }
  }, [clients]);

  return (
    <div className="space-y-6">
      {/* AI Daily Briefing */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Daily Briefing</CardTitle>
                <CardDescription>Your personalized business summary</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateBriefing}
              disabled={isLoadingBriefing}
              className="gap-1"
            >
              <RefreshCw className={cn("h-3 w-3", isLoadingBriefing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingBriefing ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : dailyBriefing ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Streamdown>{dailyBriefing}</Streamdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Click refresh to generate your daily briefing</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <Card key={insight.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {insight.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {insight.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold">{insight.value}</p>
                  <p className="text-xs text-muted-foreground">{insight.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Smart Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Smart Actions</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto-run</span>
              <Button
                variant={automationEnabled ? "default" : "outline"}
                size="sm"
                className="h-7 w-14"
                onClick={() => setAutomationEnabled(!automationEnabled)}
              >
                {automationEnabled ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {smartActions.map((action) => {
              const isNeeded = action.condition();
              const isRunning = runningActions.has(action.id);
              return (
                <div
                  key={action.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    isNeeded ? "border-yellow-500/30 bg-yellow-500/5" : "border-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isNeeded ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <Button
                    variant={isNeeded ? "default" : "outline"}
                    size="sm"
                    disabled={isRunning}
                    onClick={() => handleRunAction(action.id, action.action)}
                  >
                    {isRunning ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Run
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AISmartDashboard;
