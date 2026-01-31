import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Sparkles, Zap, CheckCircle2, XCircle, Loader2, 
  Package, DollarSign, Users, Truck, RefreshCw,
  ArrowRight, AlertTriangle, Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Streamdown } from "streamdown";

interface BulkAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  type: string;
  affectedItems?: number;
}

interface AIBulkActionsProps {
  context: "inventory" | "pricing" | "clients" | "orders";
  selectedItems?: any[];
  onActionComplete?: () => void;
}

export function AIBulkActions({ context, selectedItems = [], onActionComplete }: AIBulkActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const bulkRecommendations = trpc.ai.bulkRecommendations.useMutation();

  // Define actions based on context
  const getActions = (): BulkAction[] => {
    switch (context) {
      case "inventory":
        return [
          {
            id: "auto_reorder",
            title: "Auto-Generate Reorder List",
            description: "AI creates optimal reorder quantities for low stock items",
            icon: Package,
            type: "inventory_reorder",
          },
          {
            id: "optimize_stock",
            title: "Optimize Stock Levels",
            description: "AI suggests optimal stock levels based on demand patterns",
            icon: RefreshCw,
            type: "inventory_optimization",
          },
          {
            id: "forecast_demand",
            title: "Forecast Demand",
            description: "AI predicts future demand for selected products",
            icon: Sparkles,
            type: "demand_forecast",
          },
        ];
      
      case "pricing":
        return [
          {
            id: "optimize_all_prices",
            title: "Optimize All Prices",
            description: "AI analyzes and suggests optimal prices for all products",
            icon: DollarSign,
            type: "pricing_optimization",
          },
          {
            id: "competitive_analysis",
            title: "Competitive Analysis",
            description: "AI compares your prices with market rates",
            icon: Zap,
            type: "competitive_analysis",
          },
          {
            id: "margin_optimization",
            title: "Margin Optimization",
            description: "AI identifies products with suboptimal margins",
            icon: AlertTriangle,
            type: "margin_optimization",
          },
        ];
      
      case "clients":
        return [
          {
            id: "segment_clients",
            title: "Auto-Segment Clients",
            description: "AI categorizes clients by value and behavior",
            icon: Users,
            type: "client_segmentation",
          },
          {
            id: "upsell_opportunities",
            title: "Find Upsell Opportunities",
            description: "AI identifies clients ready for premium products",
            icon: Sparkles,
            type: "client_upsell",
          },
          {
            id: "churn_prediction",
            title: "Predict Churn Risk",
            description: "AI identifies clients at risk of leaving",
            icon: AlertTriangle,
            type: "churn_prediction",
          },
        ];
      
      case "orders":
        return [
          {
            id: "auto_process",
            title: "Auto-Process Orders",
            description: "AI validates and processes pending orders",
            icon: Play,
            type: "order_processing",
          },
          {
            id: "optimize_fulfillment",
            title: "Optimize Fulfillment",
            description: "AI suggests optimal fulfillment sequence",
            icon: Truck,
            type: "fulfillment_optimization",
          },
          {
            id: "predict_delays",
            title: "Predict Delays",
            description: "AI identifies orders at risk of delay",
            icon: AlertTriangle,
            type: "delay_prediction",
          },
        ];
      
      default:
        return [];
    }
  };

  const actions = getActions();

  const toggleAction = (actionId: string) => {
    setSelectedActions(prev => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  const handleRunActions = async () => {
    if (selectedActions.size === 0) {
      toast.error("Please select at least one action");
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResults({});
    setAiRecommendation(null);

    const actionsArray = Array.from(selectedActions);
    const totalActions = actionsArray.length;
    let completedActions = 0;
    const newResults: Record<string, { success: boolean; message: string }> = {};
    let combinedRecommendations = "";

    for (const actionId of actionsArray) {
      const action = actions.find(a => a.id === actionId);
      if (!action) continue;

      try {
        const result = await bulkRecommendations.mutateAsync({ type: action.type });
        newResults[actionId] = { success: true, message: "Completed successfully" };
        combinedRecommendations += `\n\n### ${action.title}\n${result.recommendations}`;
      } catch (error) {
        newResults[actionId] = { success: false, message: "Failed to execute" };
      }

      completedActions++;
      setProgress((completedActions / totalActions) * 100);
      setResults({ ...newResults });
    }

    setAiRecommendation(combinedRecommendations);
    setIsRunning(false);
    
    // Invalidate relevant queries
    utils.inventory.list.invalidate();
    utils.pricing.current.invalidate();
    utils.clients.list.invalidate();
    utils.clientOrders.list.invalidate();

    const successCount = Object.values(newResults).filter(r => r.success).length;
    if (successCount === totalActions) {
      toast.success(`All ${totalActions} actions completed successfully!`);
    } else {
      toast.warning(`${successCount}/${totalActions} actions completed`);
    }

    onActionComplete?.();
  };

  const handleSelectAll = () => {
    if (selectedActions.size === actions.length) {
      setSelectedActions(new Set());
    } else {
      setSelectedActions(new Set(actions.map(a => a.id)));
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1 border-primary/30"
      >
        <Zap className="h-3 w-3 text-primary" />
        AI Bulk Actions
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              AI Bulk Actions - {context.charAt(0).toUpperCase() + context.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Select actions to run. AI will process them automatically.
              {selectedItems.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {selectedItems.length} items selected
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Action Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Available Actions</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedActions.size === actions.length ? "Deselect All" : "Select All"}
                </Button>
              </div>

              {actions.map((action) => {
                const Icon = action.icon;
                const isSelected = selectedActions.has(action.id);
                const result = results[action.id];

                return (
                  <Card
                    key={action.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      isSelected && "ring-2 ring-primary",
                      result?.success === true && "border-green-500/50",
                      result?.success === false && "border-red-500/50"
                    )}
                    onClick={() => !isRunning && toggleAction(action.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          disabled={isRunning}
                          className="mt-1"
                        />
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center",
                          isSelected ? "bg-primary/20" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "h-5 w-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{action.title}</h4>
                            {result && (
                              result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Progress */}
            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* AI Recommendations */}
            {aiRecommendation && (
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none max-h-60 overflow-y-auto">
                    <Streamdown>{aiRecommendation}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleRunActions}
              disabled={isRunning || selectedActions.size === 0}
              className="gap-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run {selectedActions.size} Action{selectedActions.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AIBulkActions;
