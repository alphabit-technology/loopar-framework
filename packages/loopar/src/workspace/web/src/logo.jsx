import React from "react";
import { useWorkspace } from "@workspace/workspace-provider";
import { getImage } from "@@file/file-manager";
import { Link } from "@link";

export const Logo = ({ variant = "all", size = "sm" }) => {
  const { webApp } = useWorkspace();

  const imageProps = {
    alt: webApp.name,
    href: "/Home",
  };

  const showFull = variant === "all" || variant === "desktop";
  const showMini = variant === "all" || variant === "mobile";

  const heightClass = { sm: "h-8", md: "h-10", lg: "h-14" }[size] || "h-8";

  return (
    <div className='p-1 flex items-center'>
      <Link className='flex items-center dark:hidden' to="/Home">
        {showFull && (
          <img
            {...imageProps}
            src={getImage(webApp, "logo")}
            className={`hidden ${heightClass} md:block`}
          />
        )}
        {showMini && (
          <img
            {...imageProps}
            src={getImage(webApp, "logo_mini")}
            className="h-8 w-20 md:hidden"
            style={{ minWidth: 40, maxWidth: 40 }}
          />
        )}
      </Link>
      <Link className='hidden dark:flex items-center' to="/Home">
        {showFull && (
          <img
            {...imageProps}
            src={getImage(webApp, "logo_dark")}
            className={`hidden ${heightClass} md:block`}
          />
        )}
        {showMini && (
          <img
            {...imageProps}
            src={getImage(webApp, "logo_mini_dark")}
            className="h-8 w-20 md:hidden"
            style={{ minWidth: 40, maxWidth: 40 }}
          />
        )}
      </Link>
    </div>
  );
};
