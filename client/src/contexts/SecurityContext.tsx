import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

// Role hierarchy and permissions
export const ROLES = {
  admin: {
    level: 4,
    canViewCosts: true,
    canViewMargins: true,
    canViewSupplierTerms: true,
    canEditPricing: true,
    canEditInventory: true,
    canManageUsers: true,
    canExportData: true,
    canAccessAI: true,
    canViewAuditLog: true,
    canManageSettings: true,
  },
  operations: {
    level: 3,
    canViewCosts: false,
    canViewMargins: false,
    canViewSupplierTerms: false,
    canEditPricing: false,
    canEditInventory: true,
    canManageUsers: false,
    canExportData: true,
    canAccessAI: true,
    canViewAuditLog: false,
    canManageSettings: false,
  },
  finance: {
    level: 2,
    canViewCosts: true,
    canViewMargins: true,
    canViewSupplierTerms: true,
    canEditPricing: true,
    canEditInventory: false,
    canManageUsers: false,
    canExportData: true,
    canAccessAI: true,
    canViewAuditLog: true,
    canManageSettings: false,
  },
  view_only: {
    level: 1,
    canViewCosts: false,
    canViewMargins: false,
    canViewSupplierTerms: false,
    canEditPricing: false,
    canEditInventory: false,
    canManageUsers: false,
    canExportData: false,
    canAccessAI: false,
    canViewAuditLog: false,
    canManageSettings: false,
  },
} as const;

export type RoleName = keyof typeof ROLES;
export type RolePermissions = {
  level: number;
  canViewCosts: boolean;
  canViewMargins: boolean;
  canViewSupplierTerms: boolean;
  canEditPricing: boolean;
  canEditInventory: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canAccessAI: boolean;
  canViewAuditLog: boolean;
  canManageSettings: boolean;
};

export type Permission = keyof Omit<RolePermissions, 'level'>;

interface SecurityContextType {
  // Panic mode / lock screen
  isPanicMode: boolean;
  togglePanicMode: () => void;
  activatePanicMode: () => void;
  deactivatePanicMode: () => void;
  
  // Session timeout
  sessionTimeoutMinutes: number;
  lastActivity: number;
  isSessionExpired: boolean;
  resetActivityTimer: () => void;
  
  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  canViewSensitiveData: () => boolean;
  getUserRole: () => RoleName;
  getRolePermissions: () => RolePermissions;
  
  // Export confirmation
  showExportConfirmation: boolean;
  setShowExportConfirmation: (show: boolean) => void;
  pendingExportAction: (() => void) | null;
  setPendingExportAction: (action: (() => void) | null) => void;
  confirmExport: () => void;
  cancelExport: () => void;
  
  // Simulation mode
  isSimulationMode: boolean;
  toggleSimulationMode: () => void;
  
  // Watermark
  getWatermarkText: () => string;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

const SESSION_TIMEOUT_MINUTES = 15; // Auto-logout after 15 minutes of inactivity
const ACTIVITY_CHECK_INTERVAL = 60000; // Check every minute

export function SecurityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Panic mode state
  const [isPanicMode, setIsPanicMode] = useState(false);
  
  // Session timeout state
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  
  // Export confirmation state
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const [pendingExportAction, setPendingExportAction] = useState<(() => void) | null>(null);
  
  // Simulation mode state
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  
  // Keyboard shortcut for panic mode (Ctrl+Shift+L or Cmd+Shift+L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setIsPanicMode(true);
      }
      // ESC to exit panic mode (requires re-authentication or click)
      if (e.key === 'Escape' && isPanicMode) {
        // Don't auto-exit, require explicit action
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanicMode]);
  
  // Activity tracking for session timeout
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
      setIsSessionExpired(false);
    };
    
    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, updateActivity));
    
    // Check for session expiry
    const checkSession = setInterval(() => {
      const inactiveMinutes = (Date.now() - lastActivity) / 1000 / 60;
      if (inactiveMinutes >= SESSION_TIMEOUT_MINUTES) {
        setIsSessionExpired(true);
        setIsPanicMode(true); // Auto-activate panic mode on timeout
      }
    }, ACTIVITY_CHECK_INTERVAL);
    
    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(checkSession);
    };
  }, [lastActivity]);
  
  // Prevent browser caching
  useEffect(() => {
    // Add no-cache meta tags dynamically
    const meta1 = document.createElement('meta');
    meta1.httpEquiv = 'Cache-Control';
    meta1.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta1);
    
    const meta2 = document.createElement('meta');
    meta2.httpEquiv = 'Pragma';
    meta2.content = 'no-cache';
    document.head.appendChild(meta2);
    
    const meta3 = document.createElement('meta');
    meta3.httpEquiv = 'Expires';
    meta3.content = '0';
    document.head.appendChild(meta3);
    
    // Prevent back button from showing cached data
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    });
    
    return () => {
      document.head.removeChild(meta1);
      document.head.removeChild(meta2);
      document.head.removeChild(meta3);
    };
  }, []);
  
  const getUserRole = useCallback((): RoleName => {
    if (!user?.role) return 'view_only';
    return (user.role as RoleName) || 'view_only';
  }, [user]);
  
  const getRolePermissions = useCallback((): RolePermissions => {
    const role = getUserRole();
    return ROLES[role] || ROLES.view_only;
  }, [getUserRole]);
  
  const hasPermission = useCallback((permission: Permission): boolean => {
    const permissions = getRolePermissions();
    return permissions[permission] ?? false;
  }, [getRolePermissions]);
  
  const canViewSensitiveData = useCallback((): boolean => {
    const permissions = getRolePermissions();
    return permissions.canViewCosts || permissions.canViewMargins;
  }, [getRolePermissions]);
  
  const togglePanicMode = useCallback(() => {
    setIsPanicMode(prev => !prev);
  }, []);
  
  const activatePanicMode = useCallback(() => {
    setIsPanicMode(true);
  }, []);
  
  const deactivatePanicMode = useCallback(() => {
    setIsPanicMode(false);
    setLastActivity(Date.now());
    setIsSessionExpired(false);
  }, []);
  
  const resetActivityTimer = useCallback(() => {
    setLastActivity(Date.now());
    setIsSessionExpired(false);
  }, []);
  
  const confirmExport = useCallback(() => {
    if (pendingExportAction) {
      pendingExportAction();
    }
    setShowExportConfirmation(false);
    setPendingExportAction(null);
  }, [pendingExportAction]);
  
  const cancelExport = useCallback(() => {
    setShowExportConfirmation(false);
    setPendingExportAction(null);
  }, []);
  
  const toggleSimulationMode = useCallback(() => {
    setIsSimulationMode(prev => !prev);
  }, []);
  
  const getWatermarkText = useCallback((): string => {
    if (!user) return 'UNAUTHORIZED';
    const timestamp = new Date().toISOString().split('T')[0];
    return `${user.name || user.email || 'User'} | ${timestamp} | CONFIDENTIAL`;
  }, [user]);
  
  return (
    <SecurityContext.Provider
      value={{
        isPanicMode,
        togglePanicMode,
        activatePanicMode,
        deactivatePanicMode,
        sessionTimeoutMinutes: SESSION_TIMEOUT_MINUTES,
        lastActivity,
        isSessionExpired,
        resetActivityTimer,
        hasPermission,
        canViewSensitiveData,
        getUserRole,
        getRolePermissions,
        showExportConfirmation,
        setShowExportConfirmation,
        pendingExportAction,
        setPendingExportAction,
        confirmExport,
        cancelExport,
        isSimulationMode,
        toggleSimulationMode,
        getWatermarkText,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

// Hook for checking specific permissions
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useSecurity();
  return hasPermission(permission);
}

// Hook for sensitive data visibility
export function useSensitiveData() {
  const { canViewSensitiveData, isPanicMode } = useSecurity();
  
  const shouldBlur = isPanicMode || !canViewSensitiveData();
  
  const formatSensitiveValue = (value: string | number, type: 'currency' | 'percentage' | 'text' = 'text') => {
    if (shouldBlur) {
      return '••••••';
    }
    return value;
  };
  
  return {
    shouldBlur,
    formatSensitiveValue,
    canView: canViewSensitiveData(),
  };
}
