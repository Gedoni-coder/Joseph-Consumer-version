import { useCallback, useEffect, useState } from "react";

export function useNotice() {
  const [notice, setNotice] = useState({ message: "" });
  const show = useCallback((message: string) => setNotice({ message }), []);
  useEffect(() => {
    if (!notice.message) return;
    const timeout = window.setTimeout(() => setNotice({ message: "" }), 6000);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  return [notice.message, show] as const;
}

// SR
