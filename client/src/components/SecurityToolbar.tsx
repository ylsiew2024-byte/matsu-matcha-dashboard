import { useSecurity } from "@/contexts/SecurityContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Lock, 
  Shield, 
  Clock, 
} from "lucide-react";

const SESSION_TIMEOUT_MINUTES = 30;

export function SecurityToolbar() {
  const { 
    activatePanicMode, 
    currentRole,
    lastActivity,
  } = useSecurity();
  const { user } = useAuth();
  
  const minutesSinceActivity = Math.floor((Date.now() - lastActivity) / 1000 / 60);
  const minutesRemaining = Math.max(0, SESSION_TIMEOUT_MINUTES - minutesSinceActivity);
  
  const getRoleBadgeColor = () => {
    switch (currentRole) {
      case 'super_admin': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'manager': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'employee': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'business_client': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  const getRoleDisplayName = () => {
    switch (currentRole) {
      case 'super_admin': return 'Super Admin';
      case 'manager': return 'Manager';
      case 'employee': return 'Employee';
      case 'business_client': return 'Business Client';
      default: return currentRole;
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      {/* Session timer warning */}
      {minutesRemaining <= 5 && minutesRemaining > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse">
              <Clock className="h-3 w-3 mr-1" />
              {minutesRemaining}m
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            Session expires in {minutesRemaining} minutes
          </TooltipContent>
        </Tooltip>
      )}
      
      {/* Panic/Lock button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            onClick={activatePanicMode}
            className="h-8 w-8 border-primary/30 hover:bg-primary/10"
          >
            <Lock className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Lock Screen (Ctrl+Shift+L)</p>
          <p className="text-xs text-muted-foreground">Hide all sensitive data instantly</p>
        </TooltipContent>
      </Tooltip>
      
      {/* Role badge */}
      <Badge variant="outline" className={getRoleBadgeColor()}>
        <Shield className="h-3 w-3 mr-1" />
        {getRoleDisplayName()}
      </Badge>
    </div>
  );
}

// Compact version for mobile/sidebar
export function SecurityToolbarCompact() {
  const { activatePanicMode, currentRole } = useSecurity();
  
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={activatePanicMode}
            className="h-7 w-7"
          >
            <Lock className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          Lock Screen
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export default SecurityToolbar;
