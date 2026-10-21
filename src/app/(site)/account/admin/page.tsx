"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteChrome } from "@/components/chrome/SiteChrome";

/** Store management lives in this same app at /admin (one port). */
export default function AccountAdminRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <SiteChrome nav="store">
      <main id="main" className="sec">
        <div className="wrap-n">
          <p className="body">Opening Store…</p>
          <p className="mt3">
            <a className="btn" href="/dashboard">
              Continue to Store
            </a>
          </p>
        </div>
      </main>
    </SiteChrome>
  );
}
