import { Suspense, lazy } from "react";
import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";

const StakeKitWidget = lazy(() => import("@/components/StakeKitWidget"));

export default function StakingIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Staking");

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "calc(100vh - 60px)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Loading...
          </div>
        }
      >
        <StakeKitWidget />
      </Suspense>
    </>
  );
}
