"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import OfflineScreen from "@/components/OfflineScreen";

export default function NetworkGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  // Start as null so we don't flash the offline screen on first render
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  const goOnline = useCallback(() => setIsOnline(true), []);
  const goOffline = useCallback(() => setIsOnline(false), []);

  useEffect(() => {
    // Set the true initial value once we're in the browser
    setIsOnline(navigator.onLine);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [goOnline, goOffline]);

  return (
    <>
      {children}

      <AnimatePresence>
        {isOnline === false && (
          <motion.div
            key="offline-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <OfflineScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
