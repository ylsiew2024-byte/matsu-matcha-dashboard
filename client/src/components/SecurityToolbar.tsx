import { useSecurity } from "@/contexts/SecurityContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Shield, 
  Clock, 
} from "lucide-react";

const SESSION_TIMEOUT_MINUTES = 30;

export function SecurityToolbar() {
  const { 
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
      
      {/* Role badge */}
      <Badge variant="outline" className={getRoleBadgeColor()}>
        <Shield className="h-3 w-3 mr-1" />
        {getRoleDisplayName()}
      </Badge>
    </div>
  );
}

// Compact version for mobile/sidebar - just show role
export function SecurityToolbarCompact() {
  const { currentRole } = useSecurity();
  
  return (
    <div className="flex items-center gap-1">
      <Badge variant="outline" className="text-xs">
        <Shield className="h-3 w-3 mr-1" />
        {currentRole === 'super_admin' ? 'Admin' : currentRole}
      </Badge>
    </div>
  );
}

export default SecurityToolbar;
