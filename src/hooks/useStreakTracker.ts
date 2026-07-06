import { useState, useEffect } from 'react';

export function useStreakTracker() {
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = localStorage.getItem('lastLoginDate');
    const savedStreak = parseInt(localStorage.getItem('currentStreak') || '1', 10);
    
    if (lastLogin) {
      if (lastLogin !== today) {
        const last = new Date(lastLogin);
        const now = new Date(today);
        const diffTime = Math.abs(now.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays === 1) {
          setStreak(savedStreak + 1);
          localStorage.setItem('currentStreak', (savedStreak + 1).toString());
        } else if (diffDays > 1) {
          setStreak(1);
          localStorage.setItem('currentStreak', '1');
        } else {
          setStreak(savedStreak);
        }
        localStorage.setItem('lastLoginDate', today);
      } else {
         setStreak(savedStreak);
      }
    } else {
      localStorage.setItem('currentStreak', '1');
      localStorage.setItem('lastLoginDate', today);
    }
  }, []);
  
  return streak;
}