import { useEffect, useState } from "react";

export function usePageTour(storageKey: string, delay = 700) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const done = window.localStorage.getItem(storageKey);
    if (!done) {
      const timer = window.setTimeout(() => setOpen(true), delay);
      return () => window.clearTimeout(timer);
    }
  }, [storageKey, delay]);

  const close = () => {
    setOpen(false);
    window.localStorage.setItem(storageKey, "true");
  };

  const restart = () => setOpen(true);

  return { open, close, restart };
}
