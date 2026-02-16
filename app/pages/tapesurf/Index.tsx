import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";

export default function TapeSurfIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("TapeSurf");

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="w-full h-full">
        <iframe
          src="https://tapesurf.com/app?dashboard=beAuzEYl0EEjN69Wv0gf"
          className="w-full h-full border-0"
          style={{ minHeight: 'calc(100vh - 60px)' }}
          title="TapeSurf Dashboard"
          allow="clipboard-write"
        />
      </div>
    </>
  );
}
