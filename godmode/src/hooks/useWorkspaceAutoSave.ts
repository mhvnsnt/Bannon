import { useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, offlineMode, auth, setOfflineMode } from "../lib/firebase";
import { safeStorage } from "../lib/safeStorage";

// Using type assertions or imports to ensure type-safety
interface WorkspaceStateData {
  userId: string;
  mainView: string;
  splitViewRight: string;
  rightPanel: string | null;
  isSplitWorkspace: boolean;
  leftSidebarOpen: boolean;
  updatedAt: string;
}

export function useWorkspaceAutoSave(
  userId: string | undefined,
  state: {
    mainView: string;
    splitViewRight: string;
    rightPanel: string | null;
    isSplitWorkspace: boolean;
    leftSidebarOpen: boolean;
  },
  actions: {
    setMainView: (v: any) => void;
    setSplitViewRight: (v: string) => void;
    setRightPanel: (v: string | null) => void;
    setIsSplitWorkspace: (v: boolean) => void;
    setLeftSidebarOpen: (v: boolean) => void;
  }
) {
  const hasLoaded = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial State Restoration
  useEffect(() => {
    if (!userId) {
      hasLoaded.current = false;
      return;
    }

    let isSubscribed = true;
    hasLoaded.current = false;

    const restoreState = async () => {
      console.log(`[WORKSPACE OS] Initiating restore state sequence for user: ${userId}`);
      
      // Try to load from LocalStorage first as initial fast-render fallback
      const localBackup = safeStorage.getItem(`workspace-backup-${userId}`);
      if (localBackup) {
        try {
          const parsed = JSON.parse(localBackup);
          if (isSubscribed) {
            applyLoadedState(parsed);
          }
        } catch (e) {
          console.warn("[WORKSPACE OS] Stale localStorage backup format.", e);
        }
      }

      // If connected to Firebase, fetch from Firestore to ensure ultimate synchronization
      if (db && !offlineMode) {
        try {
          const docRef = doc(db, "workspace", userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && isSubscribed) {
            const remoteData = docSnap.data() as WorkspaceStateData;
            console.log("[WORKSPACE OS] Retrieved remote state ledger from Firestore:", remoteData);
            applyLoadedState(remoteData);
          }
        } catch (error: any) {
          console.warn("[WORKSPACE OS] Firestore sync fetch failed. Local records remain active.", error);
          if (error && (error.message?.includes('permission') || error.message?.includes('PERMISSION_DENIED') || error.code === 'permission-denied')) {
             setOfflineMode(true);
          }
        }
      }

      if (isSubscribed) {
        hasLoaded.current = true;
        console.log("[WORKSPACE OS] State initialization and override completed. Tracking session changes.");
      }
    };

    restoreState();

    return () => {
      isSubscribed = false;
    };
  }, [userId]);

  // Helper to apply loaded state values
  const applyLoadedState = (data: Partial<WorkspaceStateData>) => {
    if (data.mainView !== undefined) actions.setMainView(data.mainView);
    if (data.splitViewRight !== undefined) actions.setSplitViewRight(data.splitViewRight);
    // Be careful with full layout mismatch checks
    actions.setRightPanel(data.rightPanel !== undefined ? data.rightPanel : null);
    if (data.isSplitWorkspace !== undefined) actions.setIsSplitWorkspace(data.isSplitWorkspace);
    if (data.leftSidebarOpen !== undefined) actions.setLeftSidebarOpen(data.leftSidebarOpen);
  };

  // 2. Debounced Save Handler (5 Seconds)
  useEffect(() => {
    if (!userId || !hasLoaded.current) return;

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Schedule next auto-save
    debounceTimer.current = setTimeout(async () => {
      const payload: WorkspaceStateData = {
        userId,
        mainView: state.mainView,
        splitViewRight: state.splitViewRight,
        rightPanel: state.rightPanel,
        isSplitWorkspace: state.isSplitWorkspace,
        leftSidebarOpen: state.leftSidebarOpen,
        updatedAt: new Date().toISOString(),
      };

      console.log(`[WORKSPACE OS] Debounced auto-save triggered (5s interval). Core values:`, payload);

      // Save to localStorage
      safeStorage.setItem(`workspace-backup-${userId}`, JSON.stringify(payload));

      // Save to cloud-hosted Firestore
      if (db && !offlineMode) {
        try {
          const docRef = doc(db, "workspace", userId);
          await setDoc(docRef, payload);
          console.log("[WORKSPACE OS] Successfully persisted workspace ledger to secure cloud Firestore.");
        } catch (error: any) {
          console.warn("[WORKSPACE OS] Error persisting workspace state to Firestore (falling back to offline mode):", error.message || error);
          setOfflineMode(true);
        }
      }
    }, 5000);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [
    userId,
    state.mainView,
    state.splitViewRight,
    state.rightPanel,
    state.isSplitWorkspace,
    state.leftSidebarOpen,
  ]);
}
