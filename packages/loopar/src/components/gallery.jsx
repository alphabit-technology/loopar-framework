import BaseCarousel from "./carousel/base-carousel.jsx";
import Preassembled from "@preassembled";
import fileManager from "@@file/file-manager";
import {loopar} from "loopar"
import {useState, useCallback, useRef, useMemo} from "react"

const DEFAULT_IMAGES = [
  {
    element: "image",
    data: {
      background_image:
        "https://fastly.picsum.photos/id/174/800/600.jpg?hmac=cfaSWlI7126OpICaFPhVjWRVaaGrLtpZ7Ly9SksvbTM"
    },
  },
  {
    element: "image",
    data: {
      background_image:
        "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg"
    },
  },
];

function extractRows(value) {
  if (value && !Array.isArray(value) && Array.isArray(value.rows)) return value.rows;
  return value;
}

function imagesToElements(value, node, keyPrefix = "img") {
  return fileManager.getMappedFiles(extractRows(value)).map((file, i) => ({
    element: "image",
    node: `${node || "gallery"}-${keyPrefix}-${file.name || i}`,
    data: {
      label: file.name || `Image ${i + 1}`,
      background_image: file.src,
    },
  }));
}

export default function MetaGalery(props) {
  const data = props.data || {};
  const isServer = data.source === "Server";

  const localElements = imagesToElements(data.images, props.node);

  const seed = useMemo(() => {
    if (!isServer) return { elements: [], page: 1, hasMore: false };
    const preloaded = data.images || {};
    const pg = (!Array.isArray(preloaded) && preloaded.pagination) || null;
    const startPage = pg ? Number(pg.page) || 1 : 1;
    return {
      elements: imagesToElements(preloaded, props.node, `p${startPage}`),
      page: startPage,
      hasMore: pg ? Number(pg.page) < Number(pg.totalPages) : false,
    };
  }, [isServer, data.images, props.node]);

  const [serverElements, setServerElements] = useState(seed.elements);
  const [page, setPage] = useState(seed.page);
  const [hasMore, setHasMore] = useState(seed.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;

      // Context-relative action: resolves against the current page URL, so
      // PageController.publicActionLoadGalery serves it for any document.
      const res = await loopar.sendAction(
        "loadGalery",
        { page: nextPage },
        { freeze: false }
      );
      const rows = Array.isArray(res) ? res : (res?.rows || []);
      const pg = Array.isArray(res) ? null : res?.pagination;

      // Guards against a misbehaving server (e.g. pagination that never
      // advances): an empty page always stops the scroll, and we trust the
      // page the server *confirmed* over the one we asked for.
      const confirmedPage = pg ? Number(pg.page) || nextPage : nextPage;
      if (!rows.length || confirmedPage <= page) {
        setHasMore(false);
        return;
      }

      const els = imagesToElements(rows, props.node, `p${confirmedPage}`);
      setServerElements((prev) => [...prev, ...els]);
      setPage(confirmedPage);
      setHasMore(pg ? Number(pg.page) < Number(pg.totalPages) : false);
    } catch (e) {
      console.error("Gallery loadImages failed:", e);
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, page, props.node]);

  const newItem = () => {
    const count = (props.elements || []).filter((element) => element.element === "image").length;

    return {
      element: "image",
      data: {
        label: `Image ${count + 1}`,
        background_image:
          "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
        color_overlay: "rgba(0,0,0,0.3)",
      },
    };
  };

  const useBulk = (data.images || []).length > 0 || isServer;
  const elements = isServer ? serverElements : localElements;

  return (
    <Preassembled
      {...props}
      notDroppable={true}
      defaultElements={useBulk ? [] : DEFAULT_IMAGES}
    >
      <BaseCarousel
        {...props}
        {...(useBulk ? { elements } : {})}
        {...(isServer ? { onLoadMore: loadMore, hasMore, isLoadingMore: loadingMore } : {})}
        newItem={newItem}
      />
    </Preassembled>
  );
}

MetaGalery.designerClasses = "pt-3";

MetaGalery.metaFields = () => {
  return [
    {
      group: "content",
      elements: {
        source: {
          element: SELECT,
          data: {
            label: "Origen",
            options: ["Local", "Server"]
          }
        },
        images: {
          element: IMAGE_INPUT,
          data: {
            label: "Images",
            description:
              "Upload or link multiple images at once. When set, these drive the gallery (slides, grid and lightbox) instead of adding slides one by one.",
            multiple: true,
            accept: "image/*",
          },
        },
      },
    },
    ...BaseCarousel.metaFields(),
  ];
};
