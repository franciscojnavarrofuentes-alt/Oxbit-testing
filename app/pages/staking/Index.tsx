import { lazy, Suspense } from "react";
import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";
import { getRuntimeConfig } from "@/utils/runtime-config";

// Lazy load the widget to isolate any import-time errors
const StakeKitWidget = lazy(() =>
  import("@stakekit/widget").then((mod) => {
    // Import CSS side effect
    import("@stakekit/widget/style.css");
    return {
      default: () => {
        const apiKey = getRuntimeConfig("VITE_STAKEKIT_API_KEY") || "";
        return <mod.SKApp apiKey={apiKey} theme={mod.darkTheme} language="en" />;
      },
    };
  })
);

export default function StakingIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Staking");
  const apiKey = getRuntimeConfig("VITE_STAKEKIT_API_KEY") || "";

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
      <div className="flex justify-center" style={{ minHeight: "calc(100vh - 60px)", padding: "24px 16px" }}>
        <Suspense fallback={<p className="text-white/40">Loading staking widget...</p>}>
          <StakeKitWidget />
        </Suspense>
      </div>
    </>
  );
}
