import { useEffect, useRef } from "react";
import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";

export default function CalendarIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Calendar");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-economic-calendar.js";
    script.type = "text/javascript";
    script.async = true;
    script.textContent = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      width: "100%",
      height: "100%",
      locale: "en",
      importanceFilter: "-1,0,1",
      countryFilter: "us",
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div style={{ width: "100%", minHeight: "calc(100vh - 60px)" }}>
        <div
          className="tradingview-widget-container"
          style={{ width: "100%", height: "100%" }}
        >
          <div
            className="tradingview-widget-container__widget"
            style={{ width: "100%", height: "calc(100vh - 60px)" }}
            ref={containerRef}
          />
        </div>
      </div>
    </>
  );
}
