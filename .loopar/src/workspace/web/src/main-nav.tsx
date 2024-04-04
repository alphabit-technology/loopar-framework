import * as React from "react"
import { DeskLogo } from './desk-logo';
import { MenuIcon, XIcon } from 'lucide-react';
import { useWorkspace } from "@workspace/workspace-provider";
import {Link} from "@link"


export function MainNav() {
  const { openNav, setOpenNav, menuItems, device } = useWorkspace();
  const Icon = openNav ? XIcon : MenuIcon;
  const desktop = device === "desktop"

  const Items = menuItems.map((item, i) => (
    <Link
      className="transition-colors hover:text-foreground/80 text-foreground/60"
      key={item.id + i} 
      to={`/${item.link}`}
    >
      {item.page}
    </Link>
  ))

  const handleSetOpenNav = (e) => {
    setOpenNav(!openNav)
  }

  return (
    <>
      <div className="flex">
        <button
          onClick={handleSetOpenNav}
          className="text-gray-700 lg:hidden"
        >
          <Icon className="h-11 w-11 fill-current" />
        </button>
        <DeskLogo />
      </div>
      {desktop && <div className="flex items-center text-sm">
        {Items}
      </div>}
    </>
  )
}
