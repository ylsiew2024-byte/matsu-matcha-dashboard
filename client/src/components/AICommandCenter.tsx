import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Bot, Sparkles, Zap, TrendingUp, Package, Users, Truck, 
  DollarSign, AlertTriangle, CheckCircle2, ArrowRight, 
  Play, RefreshCw, Clock, Target, Lightbulb, ChevronRight,
  Bell, ShoppingCart, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Streamdown } from "streamdown";

interface AIAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: "inventory" | "pricing" | "clients" | "orders" | "analytics";
  priority: "high" | "medium" | "low";
  estimatedImpact?: string;
  action: () => void;
}

interface AIPrediction {
  id: string;
  type: "alert" | "opportunity" | "recommendation";
  title: string;
  description: string;
  confidence: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function AICommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  // Fetch business context for predictions
  const { data: businessContext } = trpc.analytics.businessContext.useQuery();
  const { data: lowStock } = trpc.inventory.lowStock.useQuery();
  const { data: orders } = trpc.clientOrders.list.useQuery({});

  // AI mutations
  const pricingOptimization = trpc.ai.bulkRecommendations.useMutation();
  const inventoryReorder = trpc.ai.bulkRecommendations.useMutation();
  const clientUpsell = trpc.ai.bulkRecommendations.useMutation();

  // Generate predictions based on business data
  const generatePredictions = useCallback(() => {
    const newPredictions: AIPrediction[] = [];

    // Low stock alerts
    if (lowStock && lowStock.length > 0) {
      newPredictions.push({
        id: "low-stock",
        type: "alert",
        title: `${lowStock.length} products need reordering`,
        description: "AI detected products below reorder threshold",
        confidence: 95,
        action: {
          label: "Auto-generate reorder list",
          onClick: () => handleQuickAction("inventory_reorder"),
        },
      });
    }

    // Order patterns
    if (orders && orders.length > 0) {
      const pendingOrders = orders.filter((o: any) => o.status === "pending");
      if (pendingOrders.length > 0) {
        newPredictions.push({
          id: "pending-orders",
          type: "recommendation",
          title: `${pendingOrders.length} orders awaiting processing`,
          description: "Process pending orders to improve fulfillment time",
          confidence: 90,
        });
      }
    }

    // Business growth opportunity
    if (businessContext?.clients && businessContext.clients.length > 0) {
      newPredictions.push({
        id: "upsell-opportunity",
        type: "opportunity",
        title: "Client upsell opportunities detected",
        description: "AI identified clients who may benefit from premium products",
        confidence: 85,
        action: {
          label: "View recommendations",
          onClick: () => handleQuickAction("client_upsell"),
        },
      });
    }

    // Pricing optimization
    if (businessContext?.pricing && businessContext.pricing.length > 0) {
      newPredictions.push({
        id: "pricing-optimization",
        type: "opportunity",
        title: "Pricing optimization available",
        description: "AI found opportunities to improve margins",
        confidence: 88,
        action: {
          label: "Optimize pricing",
          onClick: () => handleQuickAction("pricing_optimization"),
        },
      });
    }

    setPredictions(newPredictions);
  }, [lowStock, orders, businessContext]);

  useEffect(() => {
    generatePredictions();
  }, [generatePredictions]);

  const handleQuickAction = async (actionType: string) => {
    setActiveAction(actionType);
    setActionResult(null);

    try {
      let result;
      switch (actionType) {
        case "pricing_optimization":
          result = await pricingOptimization.mutateAsync({ type: "pricing_optimization" });
          break;
        case "inventory_reorder":
          result = await inventoryReorder.mutateAsync({ type: "inventory_reorder" });
          break;
        case "client_upsell":
          result = await clientUpsell.mutateAsync({ type: "client_upsell" });
          break;
        case "supplier_consolidation":
          result = await pricingOptimization.mutateAsync({ type: "supplier_consolidation" });
          break;
      }
      if (result) {
        setActionResult(result.recommendations);
        toast.success("AI analysis complete!");
      }
    } catch (error) {
      toast.error("Failed to run AI analysis");
    } finally {
      setActiveAction(null);
    }
  };

  const quickActions: AIAction[] = [
    {
      id: "pricing_optimization",
      title: "Optimize All Pricing",
      description: "AI analyzes and suggests optimal prices for all products",
      icon: DollarSign,
      category: "pricing",
      priority: "high",
      estimatedImpact: "+5-15% margin",
      action: () => handleQuickAction("pricing_optimization"),
    },
    {
      id: "inventory_reorder",
      title: "Smart Reorder",
      description: "Generate optimal reorder quantities based on demand",
      icon: Package,
      category: "inventory",
      priority: lowStock && lowStock.length > 0 ? "high" : "medium",
      estimatedImpact: "Prevent stockouts",
      action: () => handleQuickAction("inventory_reorder"),
    },
    {
      id: "client_upsell",
      title: "Client Upsell Analysis",
      description: "Find upsell opportunities for each client",
      icon: Users,
      category: "clients",
      priority: "medium",
      estimatedImpact: "+10-20% revenue",
      action: () => handleQuickAction("client_upsell"),
    },
    {
      id: "supplier_consolidation",
      title: "Supplier Analysis",
      description: "Analyze supplier performance and consolidation opportunities",
      icon: Truck,
      category: "analytics",
      priority: "low",
      estimatedImpact: "Reduce costs",
      action: () => handleQuickAction("supplier_consolidation"),
    },
  ];

  const priorityColors = {
    high: "bg-red-500/10 text-red-600 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    low: "bg-green-500/10 text-green-600 border-green-500/20",
  };

  const predictionIcons = {
    alert: AlertTriangle,
    opportunity: TrendingUp,
    recommendation: Lightbulb,
  };

  const predictionColors = {
    alert: "text-red-500",
    opportunity: "text-green-500",
    recommendation: "text-blue-500",
  };

  return (
    <>
      {/* Floating Command Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 h-12 px-4 rounded-full shadow-lg z-40",
          "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500",
          "flex items-center gap-2"
        )}
      >
        <Zap className="h-5 w-5" />
        <span className="font-medium">AI Actions</span>
        {predictions.filter(p => p.type === "alert").length > 0 && (
          <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
            {predictions.filter(p => p.type === "alert").length}
          </Badge>
        )}
      </Button>

      {/* Command Center Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              AI Command Center
            </DialogTitle>
            <DialogDescription>
              One-click AI actions to automate your workflow and get instant insights
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4 mt-4">
            {/* Left Column - Quick Actions */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Play className="h-4 w-4 text-primary" />
                Quick Actions
              </h3>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    const isRunning = activeAction === action.id;
                    return (
                      <Card 
                        key={action.id} 
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          isRunning && "ring-2 ring-primary"
                        )}
                        onClick={() => !isRunning && action.action()}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              "bg-primary/10"
                            )}>
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{action.title}</h4>
                                <Badge variant="outline" className={cn("text-xs", priorityColors[action.priority])}>
                                  {action.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                              {action.estimatedImpact && (
                                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {action.estimatedImpact}
                                </p>
                              )}
                            </div>
                            {isRunning ? (
                              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Right Column - Predictions & Results */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                AI Predictions & Alerts
              </h3>
              <ScrollArea className="h-[400px] pr-4">
                {actionResult ? (
                  <Card className="border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        AI Analysis Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Streamdown>{actionResult}</Streamdown>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => setActionResult(null)}
                      >
                        Clear Result
                      </Button>
                    </CardContent>
                  </Card>
                ) : predictions.length > 0 ? (
                  <div className="space-y-3">
                    {predictions.map((prediction) => {
                      const Icon = predictionIcons[prediction.type];
                      return (
                        <Card key={prediction.id} className="border-l-4 border-l-primary/50">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Icon className={cn("h-5 w-5 mt-0.5", predictionColors[prediction.type])} />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm">{prediction.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {prediction.confidence}% confidence
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{prediction.description}</p>
                                {prediction.action && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 mt-2 text-xs"
                                    onClick={prediction.action.onClick}
                                  >
                                    {prediction.action.label}
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <h4 className="font-medium">All Clear!</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        No urgent actions needed. Run a quick action to get AI insights.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AICommandCenter;
