"use client"

import { useEffect, useState } from "react";
import { TenantSettings } from "@/lib/shared/types/public";

export function useTenantSettings() {
  const [tenantSettings, setTenantSettings] =
    useState<TenantSettings | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTenantSettings() {
      try {
        // Example:
        // const data = await getTenantSettings();
        // setTenantSettings(data);
      } catch (error) {
        console.error("Failed to load tenant settings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTenantSettings();
  }, []);

  return {
    tenantSettings,
    loading,
    setTenantSettings,
  };
}