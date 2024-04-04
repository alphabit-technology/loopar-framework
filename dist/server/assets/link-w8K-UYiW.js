import { jsx } from "react/jsx-runtime";
import { l as loopar, c as cn, b as buttonVariants } from "../entry-server.js";
import { useState, useEffect } from "react";
import { useLocation, Link as Link$1 } from "react-router-dom";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
const makeUrl = (href) => {
  if (href.startsWith("http") || href.startsWith("/"))
    return href;
  const location = useLocation();
  const currentURL = location.pathname;
  const urlStructure = ["workspace", "module", "document", "action"];
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
  return `/${Object.values(urlObject).filter((e) => e && e !== "").join("/")}${queryString ? "?" + queryString : ""}`;
};
function Link({ to = "", variant = "link", size, className, children, ...props }) {
  const [called, setCalled] = useState(false);
  const url = makeUrl(to);
  const location = useLocation();
  useEffect(() => {
    if (called) {
      loopar.rootApp.navigate(url);
      setCalled(false);
    }
  }, [called, location.pathname, location.search]);
  const handleOnClick = (e) => {
    setCalled(true);
    props.onClick && props.onClick(e);
  };
  return /* @__PURE__ */ jsx(
    Link$1,
    {
      ...props,
      className: cn(buttonVariants({ variant, size }), "justify-normal text-left text-primary cursor-pointer", className),
      to: url,
      onClick: handleOnClick,
      children
    }
  );
}
export {
  Link as default,
  makeUrl
};
