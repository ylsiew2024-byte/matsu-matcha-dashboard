import { useSecurity } from "@/contexts/SecurityContext";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, createContext, useContext, useCallback, ReactNode } from "react";
import { AlertTriangle, Download } from "lucide-react";

// Export confirmation context
interface ExportContextType {
  showExportConfirmation: boolean;
  triggerExport: (action: () => void) => boolean;
  confirmExport: () => void;
  cancelExport: () => void;
}

const ExportContext = createContext<ExportContextType | null>(null);

export function ExportProvider({ children }: { children: ReactNode }) {
  const { hasPermission } = useSecurity();
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const [pendingExportAction, setPendingExportAction] = useState<(() => void) | null>(null);

  const triggerExport = useCallback((action: () => void) => {
    if (!hasPermission('canExportData')) {
      return false;
    }
    setPendingExportAction(() => action);
    setShowExportConfirmation(true);
    return true;
  }, [hasPermission]);

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

  return (
    <ExportContext.Provider value={{ showExportConfirmation, triggerExport, confirmExport, cancelExport }}>
      {children}
    </ExportContext.Provider>
  );
}

export function useExport() {
  const context = useContext(ExportContext);
  if (!context) {
    throw new Error("useExport must be used within an ExportProvider");
  }
  return context;
}

export function ExportConfirmDialog() {
  const { showExportConfirmation, confirmExport, cancelExport } = useExport();
  const { user } = useAuth();
  const [acknowledged, setAcknowledged] = useState(false);
  
  const handleConfirm = () => {
    if (acknowledged) {
      confirmExport();
      setAcknowledged(false);
    }
  };
  
  const handleCancel = () => {
    cancelExport();
    setAcknowledged(false);
  };
  
  return (
    <AlertDialog open={showExportConfirmation} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-xl">Export Confirmation Required</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to export confidential business data from the Matsu Matcha B2B system.
            </p>
            
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <p className="font-medium text-destructive mb-1">Security Notice</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• This export will be logged with your identity</li>
                <li>• Exported data contains sensitive business information</li>
                <li>• Unauthorized sharing is strictly prohibited</li>
                <li>• You are responsible for securing exported files</li>
              </ul>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>Export requested by: <span className="font-medium">{user?.name || user?.email}</span></p>
              <p>Timestamp: {new Date().toLocaleString()}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex items-start space-x-3 py-2">
          <Checkbox 
            id="acknowledge" 
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
          />
          <label 
            htmlFor="acknowledge" 
            className="text-sm leading-tight cursor-pointer"
          >
            I acknowledge that I am authorized to export this data and will handle it according to company security policies.
          </label>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!acknowledged}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Confirm Export
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook to trigger export with confirmation
export function useSecureExport() {
  const { triggerExport } = useExport();
  return { triggerExport };
}

export default ExportConfirmDialog;
