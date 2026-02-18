import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";

export default function CalendarIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Calendar");

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="w-full h-full">
        <iframe
          src="https://www.tradingview.com/embed-widget/economic-calendar/?locale=en&colorTheme=dark&isTransparent=true&width=100%25&height=100%25&importanceFilter=-1%2C0%2C1&countryFilter=us"
          className="w-full h-full border-0"
          style={{ minHeight: 'calc(100vh - 60px)' }}
          title="US Economic Calendar"
          allow="clipboard-write"
        />
      </div>
    </>
  );
}
