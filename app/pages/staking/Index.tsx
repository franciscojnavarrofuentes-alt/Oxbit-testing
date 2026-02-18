import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";
import { getRuntimeConfig } from "@/utils/runtime-config";
import "@stakekit/widget/style.css";
import { SKApp, darkTheme } from "@stakekit/widget";

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
        <SKApp apiKey={apiKey} theme={darkTheme} />
      </div>
    </>
  );
}
