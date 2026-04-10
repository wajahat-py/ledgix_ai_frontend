"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

export interface Usage {
  invoice_count: number;
  invoice_limit: number | null;
  remaining: number | null;
  plan: string;
}

export function useUsage(refreshKey?: string | number | null) {
  const [usage, setUsage]   = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<Usage>("/api/invoices/usage/")
      .then((res) => setUsage(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const atLimit = usage !== null && usage.invoice_limit !== null && usage.invoice_count >= usage.invoice_limit;

  return { usage, loading, atLimit };
}
