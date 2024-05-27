
import loopar from "$loopar";
import React, { useState, useEffect } from "react";
import { Link as ReactLink, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import BaseComponent from "@base-component";

export const makeUrl = (href) => {
  if (href.startsWith("http") || href.startsWith("/")) return href;

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

  return `/${Object.values(urlObject).filter(e => e && e !== "").join("/")}${queryString ? "?" + queryString : ""}`;
}

export function Link({ to="", variant="link", size, children, ...props}) {
  const [called, setCalled] = useState(false);
  const url = makeUrl(to);
  const location = useLocation();
  const isAbsolute = url.includes("http");

  useEffect(() => {
    if(called){
      if(to.startsWith("#")){
        goTo({ target: { getAttribute: () => to } });
      }else{
        loopar.rootApp.navigate(url);
      }
      setCalled(false);
    }
  }, [called, location.pathname, location.search]);

  const handleOnClick = (e) => {
    setCalled(true);
    props.onClick && props.onClick(e);
  }

  function goTo(event){
    const self = event.target;
    const header = document.querySelector('header');
 
    var targetId = self.getAttribute('href').substring(1);
    var target = document.getElementById(targetId);
    if(!target) return;
    var offsetTop = target.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(header).height);

    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  }

  const className = cn(buttonVariants({ variant, size }), "justify-normal text-left text-primary cursor-pointer p-2", props.className || "");
  const renderizableProps = loopar.utils.renderizableProps(props);

  if(isAbsolute) return (
    <a
      {...renderizableProps}
      key={renderizableProps.key || to}
      className={className}
      href={to}
      target={props._target}
      active
    >
      {children}
    </a>
  );

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

export default class LinkComponent extends BaseComponent {
  render() {
    const data = this.props.data;

    return <Link {...this.props} {...data} key={this.props.key || data.key || this.props.to} >{data.label}</Link>;
  }

  get metaFields() {
    return {
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
    };
  }
}