import { useSensitiveData, useSecurity } from "@/contexts/SecurityContext";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SensitiveValueProps {
  value: string | number;
  type?: 'currency' | 'percentage' | 'text';
  className?: string;
  showIcon?: boolean;
  prefix?: string;
  suffix?: string;
}

export function SensitiveValue({ 
  value, 
  type = 'text', 
  className,
  showIcon = false,
  prefix = '',
  suffix = '',
}: SensitiveValueProps) {
  const { shouldBlur, canView } = useSensitiveData();
  const { isPanicMode } = useSecurity();
  
  const formatValue = () => {
    if (shouldBlur) {
      return '••••••';
    }
    
    if (type === 'currency' && typeof value === 'number') {
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    if (type === 'percentage' && typeof value === 'number') {
      return `${value.toFixed(1)}%`;
    }
    
    return String(value);
  };
  
  const displayValue = formatValue();
  
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {prefix && !shouldBlur && <span>{prefix}</span>}
      <span className={cn(
        shouldBlur && "blur-sm select-none",
        "transition-all duration-200"
      )}>
        {displayValue}
      </span>
      {suffix && !shouldBlur && <span>{suffix}</span>}
      {showIcon && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              {shouldBlur ? (
                <Lock className="h-3 w-3 text-muted-foreground/50" />
              ) : (
                <Eye className="h-3 w-3 text-muted-foreground/30" />
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {isPanicMode 
              ? "Screen locked - data hidden" 
              : canView 
                ? "Sensitive data - visible to your role"
                : "Restricted - insufficient permissions"
            }
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

// Component for sensitive data badges/indicators
export function SensitiveDataBadge({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
          "bg-amber-500/10 text-amber-600 border border-amber-500/20",
          className
        )}>
          <Lock className="h-2.5 w-2.5" />
          SENSITIVE
        </span>
      </TooltipTrigger>
      <TooltipContent>
        This field contains confidential business data
      </TooltipContent>
    </Tooltip>
  );
}

// Component for role-restricted content
interface RestrictedContentProps {
  children: React.ReactNode;
  requiredPermission: 'canViewCosts' | 'canViewMargins' | 'canViewSupplierTerms';
  fallback?: React.ReactNode;
}

export function RestrictedContent({ 
  children, 
  requiredPermission,
  fallback 
}: RestrictedContentProps) {
  const { hasPermission, isPanicMode } = useSecurity();
  
  if (isPanicMode || !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Lock className="h-4 w-4" />
        <span>Access restricted</span>
      </div>
    );
  }
  
  return <>{children}</>;
}

export default SensitiveValue;
