"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { auth } from "@/lib/api";
import { applyTheme } from "@/lib/theme";

type AuthState = "checking" | "authenticated" | "unauthenticated";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function verifyToken() {
      // Fast path: no token at all → redirect immediately, don't even hit the network.
      const token = sessionStorage.getItem("access_token");
      if (!token) {
        if (!cancelled) {
          setAuthState("unauthenticated");
          router.replace("/login");
        }
        return;
      }

      try {
        const res = await auth.verify();
        if (cancelled) return;
        if (res?.user?.theme_preference) {
          applyTheme(res.user.theme_preference);
        }
        setAuthState("authenticated");
      } catch (err: any) {
        if (cancelled) return;

        const status = err?.status as number | undefined;

        // Only treat genuine auth rejections (401/422) as "logged out".
        // Network errors, 500s, etc. should NOT wipe the token — the user
        // may still be authenticated and the backend just momentarily unavailable.
        if (status === 401 || status === 422) {
          sessionStorage.removeItem("access_token");
          setAuthState("unauthenticated");
          router.replace("/login");
        } else {
          // Unknown error (network, 500…) — trust the token we have in storage
          // and let the user in rather than stranding them on a blank screen.
          setAuthState("authenticated");
        }
      }
    }

    verifyToken();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Blank screen while we run the auth check — shows nothing, not a flash of content.
  if (authState === "checking") {
    return (
      <div className="flex h-screen items-center justify-center bg-paper">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-hairline border-t-accent" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto bg-paper px-[22px] py-5 custom-scrollbar">{children}</main>
    </div>
  );
}

