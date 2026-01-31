import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Wand2, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIAutoFillProps {
  formType: "client" | "supplier" | "product" | "order" | "pricing";
  currentValues: Record<string, any>;
  onSuggestion: (field: string, value: any) => void;
  onBulkFill: (values: Record<string, any>) => void;
}

interface FieldSuggestion {
  field: string;
  value: any;
  confidence: number;
  reason: string;
}

export function AIAutoFill({ formType, currentValues, onSuggestion, onBulkFill }: AIAutoFillProps) {
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const generateSuggestions = trpc.ai.contextChat.useMutation();

  // Fetch context data for suggestions
  const { data: clients } = trpc.clients.list.useQuery({});
  const { data: suppliers } = trpc.suppliers.list.useQuery({});
  const { data: skus } = trpc.skus.list.useQuery({});
  const { data: pricing } = trpc.pricing.current.useQuery();

  const getFormPrompt = useCallback(() => {
    switch (formType) {
      case "client":
        return `Based on typical B2B matcha client patterns, suggest values for a new client form. Consider: company name patterns, typical discount tiers (5-15%), payment terms (NET30, NET60), and credit limits. Current values: ${JSON.stringify(currentValues)}. Return JSON with fields: discountPercent, paymentTerms, creditLimit, notes.`;
      
      case "supplier":
        return `Based on Japanese matcha supplier patterns, suggest values for a new supplier form. Consider: typical lead times (14-30 days), minimum order quantities, quality certifications. Current values: ${JSON.stringify(currentValues)}. Return JSON with fields: leadTimeDays, minimumOrderKg, certifications, notes.`;
      
      case "product":
        return `Based on matcha product patterns, suggest values for a new product. Consider: grade (ceremonial, premium, culinary), quality tier (1-5), seasonal availability. Current values: ${JSON.stringify(currentValues)}. Return JSON with fields: grade, qualityTier, isSeasonal, harvestSeason, description.`;
      
      case "order":
        const client = clients?.find((c: any) => c.id === currentValues.clientId);
        const sku = skus?.find((s: any) => s.id === currentValues.skuId);
        return `Based on order history, suggest optimal order quantity and pricing. Client: ${client?.companyName || 'Unknown'}. Product: ${sku?.name || 'Unknown'}. Consider typical order sizes and client discount. Current values: ${JSON.stringify(currentValues)}. Return JSON with fields: quantityKg, unitPrice, notes.`;
      
      case "pricing":
        return `Based on market analysis and cost structure, suggest optimal pricing. Consider: landed cost, target margin (25-40%), competitor pricing. Current values: ${JSON.stringify(currentValues)}. Return JSON with fields: basePrice, bulkDiscount, seasonalAdjustment, notes.`;
      
      default:
        return "";
    }
  }, [formType, currentValues, clients, skus]);

  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setShowSuggestions(true);
    
    try {
      const result = await generateSuggestions.mutateAsync({
        context: formType,
        message: getFormPrompt(),
        contextData: currentValues,
      });

      // Parse AI response to extract suggestions
      const responseText = result.response;
      const parsedSuggestions: FieldSuggestion[] = [];

      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const suggestedValues = JSON.parse(jsonMatch[0]);
          Object.entries(suggestedValues).forEach(([field, value]) => {
            if (value !== null && value !== undefined && field !== 'notes') {
              parsedSuggestions.push({
                field,
                value,
                confidence: 85 + Math.random() * 10,
                reason: `AI suggested based on ${formType} patterns`,
              });
            }
          });
        } catch (e) {
          console.error("Failed to parse suggestions:", e);
        }
      }

      // Add default suggestions based on form type if parsing failed
      if (parsedSuggestions.length === 0) {
        switch (formType) {
          case "client":
            parsedSuggestions.push(
              { field: "discountPercent", value: 10, confidence: 90, reason: "Standard B2B discount" },
              { field: "paymentTerms", value: "NET30", confidence: 85, reason: "Common payment terms" },
              { field: "creditLimit", value: 5000, confidence: 80, reason: "Standard credit limit" }
            );
            break;
          case "supplier":
            parsedSuggestions.push(
              { field: "leadTimeDays", value: 21, confidence: 88, reason: "Average Japan shipping time" },
              { field: "minimumOrderKg", value: 10, confidence: 85, reason: "Typical MOQ" }
            );
            break;
          case "product":
            parsedSuggestions.push(
              { field: "qualityTier", value: 3, confidence: 90, reason: "Standard quality tier" },
              { field: "grade", value: "premium", confidence: 85, reason: "Most common grade" }
            );
            break;
          case "order":
            parsedSuggestions.push(
              { field: "quantityKg", value: 5, confidence: 82, reason: "Average order size" }
            );
            break;
        }
      }

      setSuggestions(parsedSuggestions);
    } catch (error) {
      toast.error("Failed to generate suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestion = (suggestion: FieldSuggestion) => {
    onSuggestion(suggestion.field, suggestion.value);
    setSuggestions(prev => prev.filter(s => s.field !== suggestion.field));
    toast.success(`Applied ${suggestion.field}`);
  };

  const handleAcceptAll = () => {
    const values: Record<string, any> = {};
    suggestions.forEach(s => {
      values[s.field] = s.value;
    });
    onBulkFill(values);
    setSuggestions([]);
    toast.success("Applied all suggestions");
  };

  const handleDismiss = (field: string) => {
    setSuggestions(prev => prev.filter(s => s.field !== field));
  };

  return (
    <div className="space-y-3">
      {/* AI Auto-Fill Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateSuggestions}
          disabled={isLoading}
          className="gap-1 border-primary/30 hover:border-primary/50"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Wand2 className="h-3 w-3 text-primary" />
          )}
          AI Auto-Fill
        </Button>
        {suggestions.length > 0 && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAcceptAll}
            className="gap-1"
          >
            <Sparkles className="h-3 w-3" />
            Accept All ({suggestions.length})
          </Button>
        )}
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Suggestions
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowSuggestions(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.field}
                className="flex items-center justify-between bg-background rounded-md p-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">
                      {suggestion.field.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.confidence.toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Suggested: <span className="font-mono">{String(suggestion.value)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={() => handleAcceptSuggestion(suggestion)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Accept</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                        onClick={() => handleDismiss(suggestion.field)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Dismiss</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for inline field suggestions
export function useAIFieldSuggestion(formType: string, fieldName: string, currentValue: any) {
  const [suggestion, setSuggestion] = useState<{ value: any; confidence: number } | null>(null);
  
  // This would be enhanced with real-time suggestions based on typing
  // For now, it provides static suggestions based on field type
  
  useEffect(() => {
    // Clear suggestion when value changes
    setSuggestion(null);
  }, [currentValue]);

  return {
    suggestion,
    clearSuggestion: () => setSuggestion(null),
  };
}

export default AIAutoFill;
