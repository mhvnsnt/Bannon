import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, query, where, addDoc } from 'firebase/firestore';

export interface NexusGoal {
  id: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

export function useNexusGoals() {
  const [goals, setGoals] = useState<NexusGoal[]>([]);
  const [localGoals, setLocalGoals] = useState<NexusGoal[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_goals_fallback');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('nexus_goals_fallback', JSON.stringify(localGoals));
  }, [localGoals]);

  useEffect(() => {
    if (!auth || !auth.currentUser || !db) {
      setGoals(localGoals.filter(g => g.status === 'active'));
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'goals'), where('status', '==', 'active'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const currentGoals: NexusGoal[] = [];
      snap.forEach(d => {
        currentGoals.push({ id: d.id, ...d.data() } as NexusGoal);
      });
      currentGoals.sort((a, b) => b.createdAt - a.createdAt);
      setGoals(currentGoals);
    }, (error) => {
      console.warn("NexusGoals firestore listener error, falling back locally:", error);
      setGoals(localGoals.filter(g => g.status === 'active'));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [localGoals]);

  const addGoal = async (description: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    const newGoal: NexusGoal = {
      id: `local_goal_${Date.now()}`,
      description,
      status: 'active',
      priority,
      createdAt: Date.now()
    };

    if (!auth || !auth.currentUser || !db) {
      setLocalGoals(prev => [newGoal, ...prev]);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'goals'), {
        description,
        status: 'active',
        priority,
        createdAt: Date.now()
      });
    } catch (e) {
      console.warn("Failed adding goal to DB, appending locally:", e);
      setLocalGoals(prev => [newGoal, ...prev]);
    }
  };

  const updateGoalStatus = async (goalId: string, status: 'active' | 'completed' | 'failed') => {
    if (!auth || !auth.currentUser || !db) {
      setLocalGoals(prev => prev.map(g => g.id === goalId ? { ...g, status } : g));
      return;
    }

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'goals', goalId), { status }, { merge: true });
    } catch (e) {
      console.warn("Failed updating goal on DB, updating locally:", e);
      setLocalGoals(prev => prev.map(g => g.id === goalId ? { ...g, status } : g));
    }
  };

  return { goals, addGoal, updateGoalStatus };
}

