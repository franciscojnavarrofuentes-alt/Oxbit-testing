import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";

// Stakely API Key
const STAKELY_API_KEY = "01KHP27RT5J0KZCJ64ZGFGWP0G.b333dbc40b0aaf4e76b11f1943415807b310595544fc178300507cb125bbef685a6fc881fea2a1affb3b2e379f885d7d9965ccf65f5e26e05a438d281caeccfe";

export default function StakingIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Staking");

  // Stakely staking URL with API key
  const stakelyUrl = `https://stakely.io/?ref=${STAKELY_API_KEY}`;

  const handleStakeClick = () => {
    window.open(stakelyUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="staking-page-container">
        <div className="staking-hero">
          <div className="staking-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>

          <h1 className="staking-title">Stake Your Crypto Assets</h1>

          <p className="staking-description">
            Earn rewards by staking your cryptocurrency with Stakely, a secure and trusted staking provider.
            Start earning passive income on your digital assets today.
          </p>

          <div className="staking-features">
            <div className="staking-feature">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">
                <h3>Secure</h3>
                <p>Non-custodial staking with enterprise-grade security</p>
              </div>
            </div>

            <div className="staking-feature">
              <div className="feature-icon">💰</div>
              <div className="feature-text">
                <h3>Earn Rewards</h3>
                <p>Competitive APY rates across multiple networks</p>
              </div>
            </div>

            <div className="staking-feature">
              <div className="feature-icon">⚡</div>
              <div className="feature-text">
                <h3>Multi-Chain</h3>
                <p>Stake on Ethereum, Cosmos, Polkadot, and more</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleStakeClick}
            className="staking-cta-button"
          >
            <span>Start Staking with Stakely</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>

          <p className="staking-note">
            You'll be redirected to Stakely's platform to manage your staking positions securely.
          </p>
        </div>
      </div>
    </>
  );
}
