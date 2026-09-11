"use client";

import { useEffect, useState } from "react";

/**
 * Registers the service worker and surfaces an "update available" prompt when a
 * newer version has been deployed.
 *
 * Update lifecycle:
 *   1. Browser fetches sw.js on load. If its bytes changed (new build id -> new
 *      cache name), the new worker installs and enters the "waiting" state
 *      because the old one still controls the page.
 *   2. We detect the waiting worker (updatefound / existing registration.waiting)
 *      and show the refresh banner.
 *   3. On "Refresh", we post SKIP_WAITING so the new worker activates, then
 *      reload once it takes control (controllerchange).
 */
export default function ServiceWorkerManager() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const swUrl = `${basePath}/sw.js`;

    let refreshing = false;
    // When the new worker takes control, reload once to get fresh assets.
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    const promoteWaiting = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting && navigator.serviceWorker.controller) {
        // A worker is waiting and a controller already exists => this is an
        // update, not the very first install.
        setWaitingWorker(reg.waiting);
        setUpdateReady(true);
      }
    };

    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        // Already-waiting worker (e.g. installed on a previous visit).
        promoteWaiting(reg);

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(installing);
              setUpdateReady(true);
            }
          });
        });

        // Proactively check for a new version when the tab regains focus.
        const onVisible = () => {
          if (document.visibilityState === "visible") {
            reg.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", onVisible);
      })
      .catch(() => {
        // Registration failures are non-fatal; the app still works online.
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, []);

  const handleRefresh = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  if (!updateReady) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 bg-blue-600 px-4 py-3 text-sm text-white shadow-lg"
    >
      <span>A new version is available.</span>
      <button
        onClick={handleRefresh}
        className="rounded bg-white px-3 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-50"
      >
        Refresh
      </button>
    </div>
  );
}
