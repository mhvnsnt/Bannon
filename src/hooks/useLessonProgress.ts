import { useState, useEffect } from 'react';
import { LESSONS } from '../App';

export function useLessonProgress() {
  const [completedLessons, setCompletedLessons] = useState<number[]>(() => {
    const saved = localStorage.getItem('codedummy-completed-lessons');
    return saved ? JSON.parse(saved) : [1];
  });

  const [currentScreen, setCurrentScreen] = useState(() => {
    const saved = localStorage.getItem('codedummy-progress');
    return saved ? parseInt(saved, 10) : 1;
  });
  const totalScreens = LESSONS.length;

  useEffect(() => {
    localStorage.setItem('codedummy-progress', currentScreen.toString());
  }, [currentScreen]);

  useEffect(() => {
    localStorage.setItem('codedummy-completed-lessons', JSON.stringify(completedLessons));
  }, [completedLessons]);

  return { completedLessons, setCompletedLessons, currentScreen, setCurrentScreen, totalScreens };
}