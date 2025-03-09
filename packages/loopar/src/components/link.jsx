
import loopar from "loopar";
import React, { useState, useEffect } from "react";
import { Link as ReactLink, useLocation } from 'react-router';
import { cn } from "@cn/lib/utils";
import { buttonVariants } from "@cn/components/ui/button";
import { useWorkspace } from "@workspace/workspace-provider";
import { activeLink } from "@workspace/defaults";

export const makeUrl = (href) => {
  if (href.startsWith("http") || href.startsWith("/")) return href;

  const location = useLocation();
  const currentURL = global.url || location.pathname;

  const urlStructure = ["workspace", "document", "action"];
  const urlArray = currentURL.split("/");

  const urlObject = {};
  urlStructure.forEach((key, index) => {
    urlObject[key] = urlArray[index + 1];
  });

  const [baseUrl, queryString] = href.split("?");
  const baseUrlSegments = baseUrl.split("/").reverse();

  urlStructure.reverse().forEach((key, index) => {
    urlObject[key] = baseUrlSegments[index] || urlObject[key];
  });

  return `/${Object.values(urlObject).filter(e => e && e !== "").join("/")}${queryString ? "?" + queryString : ""}`;
}

export function Link({ to = "", variant = "link", size, children, notControlled, activeClassName, ...props }) {
  const [called, setCalled] = useState(false);
  const url = makeUrl(to);
  const location = useLocation();
  const isAbsolute = url.includes("http");
  const [active, setActive] = useState(null);
  
  const {setOpenNav, currentPage, workspace, activeParentMenu, activePage } = useWorkspace();

  //console.log({activePage, currentPage});
  const handleSetCalled = (called) => {
    setCalled(called);
  };

  const getHeaderHeight = () => {
    const header = document.querySelector('header');
    return parseFloat(getComputedStyle(header).height);
  };

  const detectActiveMenuViaScroll = () => {
    const scroll = window.scrollY + getHeaderHeight();
    let activeSection = null;
    let minDistance = Infinity;

    document.querySelectorAll('[id]').forEach(section => {
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
  };

  useEffect(() => {
    if (called) {
      if (to.startsWith("#")) {
        goTo({ target: { getAttribute: () => to } });
      }
      handleSetCalled(false);
    }

    if (to.startsWith("#") && typeof window !== "undefined") {
      window.addEventListener("scroll", detectActiveMenuViaScroll);
      detectActiveMenuViaScroll();
    }

    return () => {
      if (to.startsWith("#") && typeof window !== "undefined") {
        window.removeEventListener("scroll", detectActiveMenuViaScroll);
      }
    };
  }, [called, location.pathname, location.search]);

  const handleOnClick = (e) => {
    handleSetCalled(true);
    props.onClick && props.onClick(e);
    if(workspace === "web") setOpenNav(false);
  };

  function goTo(e) {
    const target = document.getElementById(e.target.getAttribute('href').substring(1));

    if (!target) return;
    const offsetTop = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight();

    window.scrollTo({
      top: offsetTop - 15,
      behavior: 'smooth'
    });
  }

  const isAsctive = props.active || (active === to.split("#")[1] || (currentPage && (currentPage === to)));

  const className = cn(
    buttonVariants({ variant, size }),
    "justify-normal cursor-pointer p-2",
    activeLink(isAsctive, activeClassName),
    props.className
  );

  const renderizableProps = loopar.utils.renderizableProps(props);
   
  if (isAbsolute || notControlled) {
    return (
      <a
        {...renderizableProps}
        key={renderizableProps.key || to}
        className={className}
        href={to}
        target={props._target}
      >
        {children}
      </a>
    );
  }

  return (
    <ReactLink
      {...renderizableProps}
      key={renderizableProps.key || to}
      className={className}
      to={url}
      onClick={handleOnClick}
      active
    >
      {children}
    </ReactLink>
  );
}

const variants = {
  primary: "primary",
  secondary: "secondary",
  default: "default",
  ghost: "ghost",
  destructive: "destructive",
};

export default function MetaLink(props) {
  const data = props.data || {};
  const className = cn(props.className, data.class || "");
  delete data.class;

  return (
    <Link {...props} {...data} className={className} key={props.key || data.key || props.to} >
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
          options: Object.keys(variants).map((button) => {
            return {
              option: button,
              value: variants[button],
            };
          }),
        },
      },
    },
  }];
}