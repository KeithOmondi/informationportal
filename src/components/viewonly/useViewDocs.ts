// The list of view-only documents for the signed-in judge or deputy registrar, and how many are still new.

import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/axios";
import type { ViewDoc } from "./ViewOnlyViewer";

export interface LibraryDoc extends ViewDoc {
  createdAt: string;
  isNew: boolean;
  fileSize?: number;
}

export const useViewDocs = () => {
  const [docs, setDocs] = useState<LibraryDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/view-docs", { timeout: 30000 });
      setDocs(res.data.data as LibraryDoc[]);
      setError(null);
    } catch {
      setError("Could not load the documents. Check your connection and try again.");
      setDocs((cur) => cur ?? []);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    const onChanged = () => void load();
    window.addEventListener("viewdocs:changed", onChanged);
    return () => {
      clearTimeout(t);
      window.removeEventListener("viewdocs:changed", onChanged);
    };
  }, [load]);

  return { docs, error, reload: load };
};
