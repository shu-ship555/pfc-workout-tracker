import { useState } from "react";

export function useAsyncAction() {
  const [isPending, setIsPending] = useState(false);

  async function run(fn: () => Promise<void>): Promise<void> {
    setIsPending(true);
    try {
      await fn();
    } finally {
      setIsPending(false);
    }
  }

  return { isPending, run };
}
