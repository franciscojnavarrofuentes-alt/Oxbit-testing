import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";

export default function AggrIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Aggr");

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="w-full h-full">
        <iframe
          src="https://aggr.pacryptodex.com"
          className="w-full h-full border-0"
          style={{ minHeight: 'calc(100vh - 60px)' }}
          title="Aggr Trade"
          allow="clipboard-write"
        />
      </div>
    </>
  );
}
