import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";

export default function StakingIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Staking");

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 60px)" }}>
        <p className="text-white/60">Coming soon.</p>
      </div>
    </>
  );
}
