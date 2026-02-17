
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { isProfileComplete } from "@/data/constant";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/privacy-policy", "/terms"];

export default function ProfileGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setChecking(false);
        return;
      }

      // User is logged in.
      if (pathname === "/profile") {
        setChecking(false);
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          if (!isProfileComplete(data)) {
            // Redirect to profile
            console.log("Profile incomplete. Redirecting to /profile");
            router.push("/profile");
          }
        } else {
             // No profile doc? Redirect.
             router.push("/profile");
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (PUBLIC_ROUTES.includes(pathname)) {
      return <>{children}</>;
  }
  
  if (checking) {
      return (
          <div className="h-screen w-screen bg-[#0A0A0A] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#BA170D]"></div>
          </div>
      );
  }

  return <>{children}</>;
}
