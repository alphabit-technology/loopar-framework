import React from "react";
import { useWorkspace } from "@workspace/workspace-provider";
import { getImage } from "@@file/file-manager";
import {Link} from "@link"

export const Logo = () => {
  const { webApp } = useWorkspace();

  const imageProps = {
    alt: webApp.name,
    href: "/Home",
  }

  return (
    <>
      <div className='p-1'>
        <Link className='inline-flex items-center dark:hidden' to="/Home">
          <img {...imageProps} src={getImage(webApp, "logo")} className="hidden h-8 md:block" />
          <img {...imageProps} src={getImage(webApp, "logo_mini")} className="h-8 w-20 md:hidden " style={{minWidth:40, maxWidth:40}}/>
        </Link>
        <Link className='hidden dark:inline-flex items-center' to="/Home">
          <img {...imageProps} src={getImage(webApp, "logo_dark")} className="hidden h-8 md:block" />
          <img {...imageProps} src={getImage(webApp, "logo_mini_dark")} className="h-8 w-20 md:hidden" style={{minWidth:40, maxWidth:40}}/>
        </Link>
      </div>
    </>
  );
};
