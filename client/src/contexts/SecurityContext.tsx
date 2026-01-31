import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { UserRole, hasPermission, Permission, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from "@shared/rbac";

// Role hierarchy and permissions
export const ROLES = {
  super_admin: {
    level: 4,
    canViewCosts: true,
    canViewMargins: true,
    canViewSupplierTerms: true,
    canEditPricing: true,
    canEditInventory: true,
    canManageUsers: true,
    canExportData: true,
    canAccessAI: true,
    canAccessAIPredictions: true,
    canViewAuditLog: true,
    canManageSettings: true,
    canDeleteRecords: true,
  },
  manager: {
    level: 3,
    canViewCosts: true,
    canViewMargins: true,
    canViewSupplierTerms: true,
    canEditPricing: true,
    canEditInventory: true,
    canManageUsers: false,
    canExportData: true,
    canAccessAI: true,
    canAccessAIPredictions: false,
    canViewAuditLog: true,
    canManageSettings: false,
    canDeleteRecords: false,
  },
  employee: {
    level: 2,
    canViewCosts: false,
    canViewMargins: false,
    canViewSupplierTerms: false,
    canEditPricing: false,
    canEditInventory: true,
    canManageUsers: false,
    canExportData: false,
    canAccessAI: false,
    canAccessAIPredictions: false,
    canViewAuditLog: false,
    canManageSettings: false,
    canDeleteRecords: false,
  },
  business_client: {
    level: 1,
    canViewCosts: false,
    canViewMargins: false,
    canViewSupplierTerms: false,
    canEditPricing: false,
    canEditInventory: false,
    canManageUsers: false,
    canExportData: false,
    canAccessAI: false,
    canAccessAIPredictions: true,
    canViewAuditLog: false,
    canManageSettings: false,
    canDeleteRecords: false,
  },
};

export type RoleName = keyof typeof ROLES;
export type RolePermissions = typeof ROLES[RoleName];

interface SecurityContextType {
  // Panic mode
  isPanicMode: boolean;
  activatePanicMode: () => void;
  deactivatePanicMode: (pin?: string) => boolean;
  
  // Simulation mode
  isSimulationMode: boolean;
  toggleSimulationMode: () => void;
  
  // Session management
  sessionTimeout: number;
  lastActivity: number;
  updateActivity: () => void;
  isSessionExpired: boolean;
  
  // Role-based permissions
  currentRole: RoleName;
  permissions: RolePermissions;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  checkPermission: (permission: Permission) => boolean;
  
  // Data visibility
  shouldBlurSensitiveData: boolean;
  
  // Export confirmation
  requireExportConfirmation: boolean;
  
  // User watermark
  userWatermark: string;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_PIN = "1234"; // In production, this should be user-configurable

interface SecurityProviderProps {
  children: ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const { user } = useAuth();
  
  // Panic mode state
  const [isPanicMode, setIsPanicMode] = useState(false);
  
  // Simulation mode state
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  
  // Session management
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  
  // Get current role
  const currentRole: RoleName = (() => {
    if (!user?.role) return 'employee';
    if (user.role in ROLES) return user.role as RoleName;
    return 'employee';
  })();
  
  const permissions = ROLES[currentRole];
  
  // Update activity timestamp
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setIsSessionExpired(false);
  }, []);
  
  // Check session timeout
  useEffect(() => {
    const checkSession = () => {
      const elapsed = Date.now() - lastActivity;
      if (elapsed > SESSION_TIMEOUT_MS) {
        setIsSessionExpired(true);
        setIsPanicMode(true); // Auto-activate panic mode on timeout
      }
    };
    
    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lastActivity]);
  
  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => updateActivity();
    
    events.forEach(event => window.addEventListener(event, handleActivity));
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [updateActivity]);
  
  // Panic mode functions
  const activatePanicMode = useCallback(() => {
    setIsPanicMode(true);
  }, []);
  
  const deactivatePanicMode = useCallback((pin?: string) => {
    if (pin === DEFAULT_PIN) {
      setIsPanicMode(false);
      updateActivity();
      return true;
    }
    return false;
  }, [updateActivity]);
  
  // Simulation mode toggle
  const toggleSimulationMode = useCallback(() => {
    setIsSimulationMode(prev => !prev);
  }, []);
  
  // Permission check
  const hasPermissionCheck = useCallback((permission: keyof RolePermissions) => {
    return !!permissions[permission];
  }, [permissions]);
  
  // Check permission using RBAC system
  const checkPermissionRBAC = useCallback((permission: Permission) => {
    return hasPermission(currentRole as UserRole, permission);
  }, [currentRole]);
  
  // Should blur sensitive data
  const shouldBlurSensitiveData = isPanicMode || !permissions.canViewCosts;
  
  // User watermark
  const userWatermark = user?.name || user?.email || 'Unknown User';
  
  const value: SecurityContextType = {
    isPanicMode,
    activatePanicMode,
    deactivatePanicMode,
    isSimulationMode,
    toggleSimulationMode,
    sessionTimeout: SESSION_TIMEOUT_MS,
    lastActivity,
    updateActivity,
    isSessionExpired,
    currentRole,
    permissions,
    hasPermission: hasPermissionCheck,
    checkPermission: checkPermissionRBAC,
    shouldBlurSensitiveData,
    requireExportConfirmation: true,
    userWatermark,
  };
  
  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
}

// Re-export for convenience
export { ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS };
export type { UserRole, Permission };
