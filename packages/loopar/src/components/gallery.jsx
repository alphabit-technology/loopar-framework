import BaseCarousel from "./carousel/base-carousel.jsx";
import Preassembled from "@preassembled";
import fileManager from "@@file/file-manager";
import {loopar} from "loopar"
import {useState, useCallback, useRef, useMemo, useEffect, useLayoutEffect} from "react"
import { useDesigner } from "@context/@/designer-context";
import { useDocument } from "@context/@/document-context";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  const {designerMode} = useDesigner();
  const {Document} = useDocument()

  const localElements = imagesToElements(data.images, props.node);

  const seed = useMemo(() => {
    if (!isServer) return { elements: [], startPage: 1, totalPages: 1 };
    const preloaded = data.images || {};
    const pg = (!Array.isArray(preloaded) && preloaded.pagination) || null;
    const startPage = pg ? Number(pg.page) || 1 : 1;
    const totalPages = pg ? Number(pg.totalPages) || startPage : startPage;
    return {
      elements: imagesToElements(preloaded, props.node, `p${startPage}`),
      startPage,
      totalPages,
    };
  }, [isServer, data.images, props.node]);

  const [serverElements, setServerElements] = useState(seed.elements);
  const [firstPage, setFirstPage] = useState(seed.startPage);
  const [lastPage, setLastPage] = useState(seed.startPage);
  const [totalPages, setTotalPages] = useState(seed.totalPages);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const loadingRef = useRef(false);
  const loadingPrevRef = useRef(false);
  const pendingAnchor = useRef(null);

  const hasMore = lastPage < totalPages;
  const hasPrev = firstPage > 1;

  const fetchPage = useCallback(async (p) => {
    const res = await (designerMode ? 
      loopar.rpc.get(Document.name, "loadGalery", { page: p }) : 
      loopar.sendAction("loadGalery", { page: p }, { freeze: false }));

    const rows = Array.isArray(res) ? res : (res?.rows || []);
    const pg = Array.isArray(res) ? null : res?.pagination;
    return { rows, pg };
  }, [designerMode, Document]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || lastPage >= totalPages) return;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = lastPage + 1;
      const { rows, pg } = await fetchPage(nextPage);
      const confirmedPage = pg ? Number(pg.page) || nextPage : nextPage;
      if (!rows.length || confirmedPage <= lastPage) return;
      const els = imagesToElements(rows, props.node, `p${confirmedPage}`);
      setServerElements((prev) => [...prev, ...els]);
      setLastPage(confirmedPage);
      if (pg?.totalPages) setTotalPages(Number(pg.totalPages) || totalPages);
    } catch (e) {
      console.error("Gallery loadMore failed:", e);
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [lastPage, totalPages, props.node, fetchPage]);

  const loadPrev = useCallback(async () => {
    if (loadingPrevRef.current || firstPage <= 1) return;
    loadingPrevRef.current = true;
    setLoadingPrev(true);
    try {
      const prevPage = firstPage - 1;
      const { rows } = await fetchPage(prevPage);
      if (!rows.length) { setFirstPage(1); return; }
      const els = imagesToElements(rows, props.node, `p${prevPage}`);
      if (typeof document !== "undefined") {
        pendingAnchor.current = { prevHeight: document.documentElement.scrollHeight };
      }
      setServerElements((prev) => [...els, ...prev]);
      setFirstPage(prevPage);
    } catch (e) {
      console.error("Gallery loadPrev failed:", e);
    } finally {
      loadingPrevRef.current = false;
      setLoadingPrev(false);
    }
  }, [firstPage, props.node, fetchPage]);

  useIsoLayoutEffect(() => {
    if (pendingAnchor.current == null || typeof window === "undefined") return;
    const { prevHeight } = pendingAnchor.current;
    pendingAnchor.current = null;
    const delta = document.documentElement.scrollHeight - prevHeight;
    if (delta) window.scrollBy(0, delta);
  }, [serverElements]);

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
        {...(isServer ? {
          onLoadMore: loadMore, hasMore, isLoadingMore: loadingMore,
          onLoadPrev: loadPrev, hasPrev, isLoadingPrev: loadingPrev,
        } : {})}
        newItem={newItem}
      />
    </Preassembled>
  );
}


MetaGalery.metaFields = () => {
  return [
    {
      group: "content",
      elements: {
        page_size: {
          element: INPUT,
          data: {
            label: "Page Size",
            description: "The number of images to load per page.",
            format: "integer",
            default_value: 10,
          }
        },
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
