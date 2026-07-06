import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

export const useFeatureFlag = (flagName, userPlan) => {
  const [canAccess, setCanAccess]         = useState(false);
  const [loading, setLoading]             = useState(true);
  const [isEarlyAccess, setIsEarlyAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/feature_flags` +
          `?name=eq.${flagName}` +
          `&select=enabled,early_access_plans`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        const flag = data?.[0];
        if (cancelled) return;

        if (!flag) {
          setCanAccess(false); return;
        }
        if (flag.enabled) {
          setCanAccess(true);
          setIsEarlyAccess(false); return;
        }
        if (flag.early_access_plans?.includes(userPlan)) {
          setCanAccess(true);
          setIsEarlyAccess(true); return;
        }
        setCanAccess(false);
      } catch {
        if (!cancelled) setCanAccess(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [flagName, userPlan]);

  return { canAccess, loading, isEarlyAccess };
};
