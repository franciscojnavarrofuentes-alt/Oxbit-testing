import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";

export default function StakingIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Staking");

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="w-full h-full">
        <iframe
          src="https://dapp.stakek.it/"
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 60px)" }}
          title="Staking & DeFi Yields"
          allow="clipboard-write"
        />
      </div>
    </>
  );
}
