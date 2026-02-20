import { useEffect, useRef } from "react";
import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";
import { getRuntimeConfig } from "@/utils/runtime-config";

export default function StakingIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Staking");
  const apiKey = getRuntimeConfig("VITE_STAKEKIT_API_KEY") || "";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        // Use the bundle version to avoid React context conflicts
        await import("@stakekit/widget/bundle/css");
        const { renderSKWidget, darkTheme } = await import("@stakekit/widget/bundle");

        const { unmount } = renderSKWidget({
          container: containerRef.current!,
          apiKey,
          theme: darkTheme,
        });

        cleanup = unmount;
      } catch (err) {
        console.error("StakeKit widget failed to load:", err);
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 40px;">Failed to load staking widget. Please try again later.</p>';
        }
      }
    })();

    return () => {
      cleanup?.();
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [apiKey]);

  if (!apiKey) {
    return (
      <>
        {renderSEOTags(pageMeta, pageTitle)}
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 60px)" }}>
          <p className="text-white/60">Staking widget is not configured.</p>
        </div>
      </>
    );
  }

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div
        ref={containerRef}
        style={{ minHeight: "calc(100vh - 60px)", width: "100%", display: "flex", justifyContent: "center", padding: "24px 16px" }}
      />
    </>
  );
}
