import { useSecurity } from "@/contexts/SecurityContext";
import { Button } from "@/components/ui/button";
import { FlaskConical, X, AlertTriangle } from "lucide-react";
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
import { useState } from "react";

export function SimulationModeBanner() {
  const { isSimulationMode, toggleSimulationMode } = useSecurity();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  if (!isSimulationMode) return null;
  
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[80] bg-amber-500 text-amber-950 py-2 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5 animate-pulse" />
            <div>
              <p className="font-semibold text-sm">SIMULATION MODE ACTIVE</p>
              <p className="text-xs opacity-80">
                Changes will NOT affect live data. Exit simulation to apply changes to production.
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowExitConfirm(true)}
            className="bg-amber-600 border-amber-700 text-white hover:bg-amber-700"
          >
            <X className="h-4 w-4 mr-1" />
            Exit Simulation
          </Button>
        </div>
      </div>
      
      {/* Spacer to push content down */}
      <div className="h-14" />
      
      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <AlertDialogTitle>Exit Simulation Mode?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to exit simulation mode. Any simulated changes will be discarded.
              </p>
              <p className="text-sm text-muted-foreground">
                If you want to apply simulation changes to live data, use the "Apply to Production" 
                feature instead.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay in Simulation</AlertDialogCancel>
            <AlertDialogAction 
              onClick={toggleSimulationMode}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Exit & Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Button to enter simulation mode
export function EnterSimulationButton() {
  const { isSimulationMode, toggleSimulationMode, hasPermission } = useSecurity();
  const [showConfirm, setShowConfirm] = useState(false);
  
  if (isSimulationMode) return null;
  if (!hasPermission('canEditPricing') && !hasPermission('canEditInventory')) return null;
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowConfirm(true)}
        className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
      >
        <FlaskConical className="h-4 w-4 mr-2" />
        Enter Simulation Mode
      </Button>
      
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-amber-500" />
              </div>
              <AlertDialogTitle>Enter Simulation Mode?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>
                Simulation mode allows you to test changes without affecting live production data.
              </p>
              <ul className="text-sm space-y-1 mt-2">
                <li>• All changes are isolated from production</li>
                <li>• You can safely test pricing and inventory scenarios</li>
                <li>• Changes must be explicitly applied to go live</li>
                <li>• A clear banner will indicate simulation mode</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                toggleSimulationMode();
                setShowConfirm(false);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <FlaskConical className="h-4 w-4 mr-2" />
              Enter Simulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SimulationModeBanner;
