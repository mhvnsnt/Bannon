import { useState, useCallback, useRef } from 'react';

type Task = () => Promise<any>;

export function useTaskQueue() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queue = useRef<Task[]>([]);
  const isCancelled = useRef(false);

  const enqueue = useCallback(async (task: Task) => {
    queue.current.push(task);
    if (!running) {
      isCancelled.current = false;
      setRunning(true);
      setError(null);
      await processQueue();
    }
  }, [running]);

  const cancel = useCallback(() => {
    isCancelled.current = true;
    queue.current = [];
  }, []);

  const processQueue = async () => {
    while (queue.current.length > 0 && !isCancelled.current) {
      const task = queue.current.shift();
      if (task) {
        try {
          await task();
        } catch (err: any) {
          console.error("Task failed:", err);
          setError(err.message || "Unknown task error");
          // Continue processing remaining tasks
        }
      }
    }
    setRunning(false);
  };

  return { enqueue, cancel, running, error };
}
