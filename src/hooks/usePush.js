import { useState, useEffect } from "react";
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
  showTestNotification,
} from "../api/pushService";
import { useAuth } from "./useAuth";

export default function usePush() {
  const { user } = useAuth();
  const [permission, setPermission]   = useState(getPermissionState());
  const [subscribed, setSubscribed]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [supported, setSupported]     = useState(false);

  useEffect(() => {
    const supported = isPushSupported();
    setSupported(supported);
    console.log("[ProRated] Push supported:", supported, "Permission:", typeof Notification !== "undefined" ? Notification.permission : "N/A");
    isSubscribed().then(setSubscribed);
  }, []);

  const subscribe = async () => {
    setLoading(true);
    const result = await subscribeToPush(user?.id);
    if (result.success) {
      setSubscribed(true);
      setPermission("granted");
      // Send a test notification so they know it's working
      await showTestNotification();
    }
    setLoading(false);
    return result;
  };

  const unsubscribe = async () => {
    setLoading(true);
    const result = await unsubscribeFromPush(user?.id);
    if (result.success) setSubscribed(false);
    setLoading(false);
    return result;
  };

  return {
    supported,
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
    showTestNotification,
  };
}
