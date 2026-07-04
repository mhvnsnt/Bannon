import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';

export interface MeshNode {
  id: string;
  name: string;
  type: string;
  lastActive: number;
}

export function useNexusMesh() {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [localNodeId, setLocalNodeId] = useState<string>('');

  useEffect(() => {
    const nodeId = `node_${Math.random().toString(36).substr(2, 9)}`;
    setLocalNodeId(nodeId);

    let unsubscribe: any = null;
    let heartbeat: any = null;
    let fallbackInterval: any = null;
    let activeNodeRef: any = null;
    let registeredOnRealDb = false;

    const useSimulatedNodes = () => {
      const mockNodes: MeshNode[] = [
        {
          id: nodeId,
          name: `Client Browser Node (${navigator.platform || 'Unknown OS'}) [Local Sandbox]`,
          type: 'client',
          lastActive: Date.now()
        },
        {
          id: 'apex_sim',
          name: 'Apex Singularity Node [Local Space Edge]',
          type: 'server',
          lastActive: Date.now() - 3000
        },
        {
          id: 'vault_sim',
          name: 'Temporal Vault Beacon [Offline Archive]',
          type: 'relay',
          lastActive: Date.now() - 8000
        }
      ];
      setNodes(mockNodes);
    };

    // Clean up any existing listeners/heartbeats
    const clearRealConnection = () => {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (registeredOnRealDb && db && activeNodeRef) {
        deleteDoc(activeNodeRef).catch(() => {});
        activeNodeRef = null;
        registeredOnRealDb = false;
      }
    };

    const setupTelemetryAndConnection = async (currentUser: any) => {
      clearRealConnection();

      if (!db || !currentUser || currentUser.uid === 'offline-identity-key' || currentUser.uid === 'offline-architect') {
        // Fall back to offline simulation
        useSimulatedNodes();
        if (!fallbackInterval) {
          fallbackInterval = setInterval(useSimulatedNodes, 15000);
        }
        return;
      }

      // We have a real user and real database!
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
      }

      const uid = currentUser.uid;
      const nodeRef = doc(db, 'users', uid, 'nodes', nodeId);
      activeNodeRef = nodeRef;

      try {
        await setDoc(nodeRef, {
          id: nodeId,
          name: `Browser Node (${navigator.platform || 'Unknown'})`,
          type: 'client',
          lastActive: Date.now()
        });
        registeredOnRealDb = true;

        // Heartbeat updates
        heartbeat = setInterval(async () => {
          try {
            if (db && nodeRef && registeredOnRealDb) {
              await setDoc(nodeRef, { lastActive: Date.now() }, { merge: true });
            }
          } catch {
            // If connection drops, enter fallback
            clearRealConnection();
            useSimulatedNodes();
            fallbackInterval = setInterval(useSimulatedNodes, 15000);
          }
        }, 15000);

        // Subscribing to database updates of other online nodes
        unsubscribe = onSnapshot(
          collection(db, 'users', uid, 'nodes'),
          (snap) => {
            const activeNodes: MeshNode[] = [];
            const now = Date.now();
            snap.forEach((d) => {
              const data = d.data();
              if (now - data.lastActive < 60000) {
                activeNodes.push({
                  id: data.id || d.id,
                  name: data.name || 'Unknown Node',
                  type: data.type || 'client',
                  lastActive: data.lastActive || now
                });
              } else {
                deleteDoc(d.ref).catch(() => {});
              }
            });
            setNodes(activeNodes);
          },
          () => {
            // onError callback
            clearRealConnection();
            useSimulatedNodes();
            fallbackInterval = setInterval(useSimulatedNodes, 15000);
          }
        );

      } catch (err) {
        // Failed on boot, fallback
        clearRealConnection();
        useSimulatedNodes();
        if (!fallbackInterval) {
          fallbackInterval = setInterval(useSimulatedNodes, 15000);
        }
      }
    };

    // Listen of authentication changes
    let authUnsubscribe: any = null;
    if (auth) {
      authUnsubscribe = auth.onAuthStateChanged((currentUser: any) => {
        setupTelemetryAndConnection(currentUser).catch(() => {
          useSimulatedNodes();
        });
      });
    } else {
      useSimulatedNodes();
      fallbackInterval = setInterval(useSimulatedNodes, 15000);
    }

    const cleanupAll = () => {
      if (authUnsubscribe) authUnsubscribe();
      clearRealConnection();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };

    window.addEventListener('beforeunload', cleanupAll);

    return () => {
      cleanupAll();
      window.removeEventListener('beforeunload', cleanupAll);
    };
  }, []);

  return { nodes, localNodeId };
}

