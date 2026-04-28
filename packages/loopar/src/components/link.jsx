import loopar from "loopar";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link as ReactLink } from 'react-router';
import { cn } from "@cn/lib/utils";
import { buttonVariants } from "@cn/components/ui/button";
import { useWorkspace } from "@workspace/workspace-provider";
import { activeLink } from "@workspace/defaults";
import { useDesigner } from "@context/@/designer-context";
import { VARIANTS } from "./base/ComponentDefaults";

const URL_STRUCTURE = ["workspace", "document", "action"];
const HEADER_OFFSET = 15;

const buildUrl = (href, currentURL) => {
  if (!href || href.startsWith("http") || href.startsWith("/")) return href;

  const [cleanCurrentURL] = (currentURL ?? "").split("?");
  const urlArray = cleanCurrentURL.split("/");
  const urlObject = {};

  URL_STRUCTURE.forEach((key, index) => {
    urlObject[key] = urlArray[index + 1];
  });

  const [baseUrl, queryString] = href.split("?");
  const baseUrlSegments = baseUrl.split("/").reverse();

  URL_STRUCTURE.slice().reverse().forEach((key, index) => {
    urlObject[key] = baseUrlSegments[index] || urlObject[key];
  });

  const path = Object.values(urlObject).filter(Boolean).join("/");
  return `/${path}${queryString ? `?${queryString}` : ""}`;
};

function parseParams(pathname, workspaceName = 'desk') {
  pathname = pathname.split("?")[0];
  const routeStructure = { host: null, document: null, action: null };

  const adjustedPathname = ["web", "auth"].includes(workspaceName)
    ? pathname
    : pathname.split("/").slice(1).join("/");

  const segments = adjustedPathname.split("/");
  const keys = Object.keys(routeStructure);

  for (let i = 0; i < segments.length && i < keys.length; i++) {
    if (segments[i]?.length > 0) {
      routeStructure[keys[i]] = decodeURIComponent(segments[i]);
    }
  }

  return routeStructure;
}

function setDefaultParams(params, workspaceName = 'desk') {
  if (!params.document && !params.action && workspaceName === 'desk') {
    params.document = "Desk";
    params.action = "view";
  }

  if (!params.action || !params.document) {
    params.name = params.document;
    params.document = 'Module';
    params.action ??= 'view';
  }

  return params;
}

export const useMakeUrl = (href) => {
  const { pathname } = useWorkspace();

  return useMemo(() => {
    return buildUrl(href, pathname);
  }, [href, pathname]);
};

export const makeUrl = (href) => {
  if (!href || href.startsWith("http") || href.startsWith("/")) return href;
  const currentURL = global.url || (typeof window !== 'undefined' ? window.location.pathname : '');
  return buildUrl(href, currentURL);
};

const useHeaderHeight = () => {
  return useCallback(() => {
    const header = document.querySelector('header');
    return header ? parseFloat(getComputedStyle(header).height) : 0;
  }, []);
};

const useScrollToSection = (to) => {
  const getHeaderHeight = useHeaderHeight();
  return useCallback(() => {
    if (!to.startsWith("#")) return;
    const target = document.getElementById(to.substring(1));
    if (!target) return;
    const offsetTop = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight();
    window.scrollTo({ top: offsetTop - HEADER_OFFSET, behavior: 'smooth' });
  }, [to, getHeaderHeight]);
};

const useActiveSection = (to, enabled) => {
  const [active, setActive] = useState(null);
  const getHeaderHeight = useHeaderHeight();
  const { pathname } = useWorkspace();

  const detectActiveSection = useCallback(() => {
    const scroll = window.scrollY + getHeaderHeight();
    let activeSection = null;
    let minDistance = Infinity;

    document.querySelectorAll('[id][data-section]').forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const distance = Math.abs(top - scroll);

      if (
        distance <= minDistance &&
        ((top <= scroll && top + height > scroll) ||
         (top + height <= scroll + window.innerHeight && top >= scroll) ||
         (scroll >= top && scroll < top + height))
      ) {
        minDistance = distance;
        activeSection = section.id;
      }
    });

    setActive(activeSection);
  }, [getHeaderHeight]);

  useEffect(() => {
    if (!enabled) return;
    const id = setTimeout(detectActiveSection, 100);
    window.addEventListener("scroll", detectActiveSection, { passive: true });
    return () => {
      window.removeEventListener("scroll", detectActiveSection);
      clearTimeout(id);
    };
  }, [enabled, detectActiveSection, pathname]);

  return active;
};

export function Link({
  to = "",
  variant = "link",
  size,
  children,
  notControlled,
  activeClassName,
  onClick,
  ...props
}) {
  const { setOpenNav, currentPage, workspace, award } = useWorkspace();
  const { designing } = useDesigner();

  const url = useMakeUrl(to);

  const isAbsolute = url?.includes("http");
  const isHashLink = to.startsWith("#");

  const scrollToSection = useScrollToSection(to);
  const activeSection = useActiveSection(to, isHashLink);

  const params = useMemo(() => {
    if (!url) return { document: '', action: 'view' };
    return setDefaultParams(parseParams(url, workspace), workspace);
  }, [url, workspace]);

  const canRender = useMemo(() => {
    if (props.award === false || workspace != "desk" || isAbsolute) return true;
    
    const doc = params.document?.toLowerCase().replaceAll(" ", "") ?? '';
    const action = params.action ?? 'view';

    return award(doc, action, false);
  }, [params, award, props.award, workspace, url, to]);

  const handleClick = useCallback((e) => {
    if (isHashLink) {
      e.preventDefault();
      scrollToSection();
      return;
    }
    onClick?.(e);
    if (workspace === "web") setOpenNav(false);
  }, [isHashLink, scrollToSection, onClick, workspace, setOpenNav]);

  const isActive = useMemo(() => {
    if (props.active) return true;
    return currentPage && currentPage === to;
  }, [props.active, to, currentPage]);

  if (!canRender && !props.renderOnRestrict) return null;

  const classVariant = buttonVariants({ variant, size }).replaceAll("text-primary", "");
  
  const className = cn(
    "justify-normal cursor-pointer p-2",
    canRender && !props.renderOnRestrict && activeLink(isActive, activeClassName),
    classVariant,
    "justify-start",
    props.className,
  );

  const renderizableProps = loopar.utils.renderizableProps(props);
  const commonProps = {
    ...renderizableProps,
    className,
    ...(designing && { draggable: false }),
  };

  if(props.disabled || onClick){
    return <button {...commonProps} onClick={handleClick} className={className} disabled={props.disabled}>{children}</button>
  }

  if (isAbsolute || notControlled) {
    return (
      <a
        {...commonProps}
        href={to}
        _target={props._target}
        key={renderizableProps.key || to}
      >
        {children}
      </a>
    );
  }

  if(!canRender && props.renderOnRestrict){
    return <div {...commonProps} disabled={true}>
      {children}
    </div>
  }

  return (
    <ReactLink
      {...commonProps}
      to={url}
      onClick={handleClick}
      key={renderizableProps.key || url}
    >
      {children}
    </ReactLink>
  );
}

export default function MetaLink({...props}) {
  const data = props.data || {};
  const { class: dataClass, ...restData } = data;

  return (
    <Link
      {...props}
      {...restData}
      className={cn(props.className, dataClass)}
      variant={VARIANTS[data.variant] || VARIANTS.default}
      key={props.key || data.key || props.to}
    >
      {data.label || props.children}
    </Link>
  );
}

MetaLink.droppable = false;
MetaLink.metaFields = () => [{
  group: "form",
  elements: {
    to: { element: INPUT },
    _target: {
      element: SELECT,
      data: {
        options: [
          { option: "self",  value: "_self"  },
          { option: "blank", value: "_blank" },
        ],
      },
    },
    variant: {
      element: SELECT,
      data: {
        options: Object.keys(VARIANTS).map(k => ({ value: VARIANTS[k], label: k })),
      },
    },
  },
}];