import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";

// Stakely API Key
const STAKELY_API_KEY = "01KHP27RT5J0KZCJ64ZGFGWP0G.b333dbc40b0aaf4e76b11f1943415807b310595544fc178300507cb125bbef685a6fc881fea2a1affb3b2e379f885d7d9965ccf65f5e26e05a438d281caeccfe";

export default function StakingIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Staking");

  // Stakely staking interface URL
  // Note: This URL may need adjustment based on Stakely's actual embed URL format
  const stakelyUrl = `https://app.stakely.io/staking?apiKey=${STAKELY_API_KEY}`;

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="staking-container">
        <iframe
          src={stakelyUrl}
          title="Stakely Staking"
          className="staking-iframe"
          allow="clipboard-write"
        />
      </div>
    </>
  );
}
