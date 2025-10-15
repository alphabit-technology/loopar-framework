import loopar from "loopar";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link as ReactLink, useLocation } from 'react-router';
import { cn } from "@cn/lib/utils";
import { buttonVariants } from "@cn/components/ui/button";
import { useWorkspace } from "@workspace/workspace-provider";
import { activeLink } from "@workspace/defaults";
import { useDesigner } from "@context/@/designer-context";

const URL_STRUCTURE = ["workspace", "document", "action"];
const HEADER_OFFSET = 15;

const buildUrl = (href, currentURL) => {
  if (!href || href.startsWith("http") || href.startsWith("/")) return href;

  const urlArray = currentURL.split("/");
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

export const useMakeUrl = (href) => {
  const location = useLocation();
  
  return useMemo(() => {
    const currentURL = global.url || location.pathname;
    return buildUrl(href, currentURL);
  }, [href, location.pathname]);
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
    
    const targetId = to.substring(1);
    const target = document.getElementById(targetId);

    if (!target) return;

    const offsetTop = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight();

    window.scrollTo({
      top: offsetTop - HEADER_OFFSET,
      behavior: 'smooth'
    });
  }, [to, getHeaderHeight]);
};

const useActiveSection = (to, enabled) => {
  const [active, setActive] = useState(null);
  const getHeaderHeight = useHeaderHeight();
  const location = useLocation();

  const detectActiveSection = useCallback(() => {
    const scroll = window.scrollY + getHeaderHeight();
    let activeSection = null;
    let minDistance = Infinity;

    document.querySelectorAll('[id][data-section]').forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const distance = Math.abs(sectionTop - scroll);

      if (
        distance <= minDistance && 
        ((sectionTop <= scroll && sectionTop + sectionHeight > scroll) ||
         (sectionTop + sectionHeight <= scroll + window.innerHeight && sectionTop >= scroll) ||
         (scroll >= sectionTop && scroll < sectionTop + sectionHeight))
      ) {
        minDistance = distance;
        activeSection = section.id;
      }
    });

    setActive(activeSection);
  }, [getHeaderHeight]);

  useEffect(() => {
    if (!enabled) return;

    const timeoutId = setTimeout(detectActiveSection, 100);
    window.addEventListener("scroll", detectActiveSection, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", detectActiveSection);
      clearTimeout(timeoutId);
    };
  }, [enabled, detectActiveSection, location.pathname]);

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
  const location = useLocation();
  const { setOpenNav, currentPage, workspace } = useWorkspace();
  const { designing } = useDesigner();
  
  const url = useMakeUrl(to);
  const isAbsolute = url?.includes("http");
  const isHashLink = to.startsWith("#");

  const scrollToSection = useScrollToSection(to);
  const activeSection = useActiveSection(to, isHashLink);

  const handleClick = useCallback((e) => {
    if (isHashLink) {
      e.preventDefault();
      scrollToSection();
    }
    
    onClick?.(e);
    
    if (workspace === "web") {
      setOpenNav(false);
    }
  }, [isHashLink, scrollToSection, onClick, workspace, setOpenNav]);

  const isActive = useMemo(() => {
    if (props.active) return true;
    if (isHashLink && activeSection) {
      return activeSection === to.substring(1);
    }
    return currentPage && currentPage === to;
  }, [props.active, isHashLink, activeSection, to, currentPage]);

  const className = cn(
    buttonVariants({ variant, size }),
    "justify-normal cursor-pointer p-2",
    activeLink(isActive, activeClassName),
    props.className
  );

  const renderizableProps = loopar.utils.renderizableProps(props);
  const commonProps = {
    ...renderizableProps,
    className,
    ...(designing && { draggable: false })
  };

  if (isAbsolute || notControlled) {
    return (
      <a
        {...commonProps}
        href={to}
        target={props._target}
        onClick={handleClick}
        key={renderizableProps.key || to}
      >
        {children}
      </a>
    );
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

const VARIANTS = {
  primary: "primary",
  secondary: "secondary",
  default: "default",
  ghost: "ghost",
  destructive: "destructive",
};

export default function MetaLink(props) {
  const data = props.data || {};
  const { class: dataClass, ...restData } = data;
  const className = cn(props.className, dataClass);

  return (
    <Link 
      {...props} 
      {...restData} 
      className={className} 
      key={props.key || data.key || props.to}
    >
      {data.label}
    </Link>
  );
}

MetaLink.metaFields = () => {
  return [{
    group: "form",
    elements: {
      to: {
        element: INPUT,
      },
      _target: {
        element: SELECT,
        data: {
          options: [
            { option: "self", value: "_self" },
            { option: "blank", value: "_blank" },
          ],
        },
      },
      variant: {
        element: SELECT,
        data: {
          options: Object.keys(VARIANTS).map((button) => ({
            option: button,
            value: VARIANTS[button],
          })),
        },
      },
    },
  }];
};