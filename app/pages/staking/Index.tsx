import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";
import { getRuntimeConfig } from "@/utils/runtime-config";

export default function StakingIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Staking");
  const apiKey = getRuntimeConfig("VITE_STAKEKIT_API_KEY") || "";

  const widgetUrl = apiKey
    ? `https://widget.stakek.it/?api_key=${apiKey}`
    : "https://widget.stakek.it/";

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="w-full h-full">
        <iframe
          src={widgetUrl}
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 60px)" }}
          title="Staking & DeFi Yields"
          allow="clipboard-write"
        />
      </div>
    </>
  );
}
