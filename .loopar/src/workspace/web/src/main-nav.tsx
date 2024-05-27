import { DeskLogo } from './desk-logo';
import { MenuIcon, XIcon } from 'lucide-react';
import { useWorkspace } from "@workspace/workspace-provider";
import {Link} from "@link"

export function MainNav() {
  const { openNav, setOpenNav, menuItems, device, currentPage } = useWorkspace();
  const Icon = openNav ? XIcon : MenuIcon;
  //const desktop = device === "desktop"

  const Items = menuItems.filter((item: { parent_menu: any; }) => !item.parent_menu).map((item, i) => {
    const active = currentPage === item.page ? "text-foreground/100 bg-foreground/10 rounded-full px-4" : "px-4";
    return (
      <Link
        className={`transition-colors hover:text-foreground/80 text-foreground/60 px-2 py-1 ${active}`}
        key={item.id + i} 
        to={`/${item.link}`}
      >
        {item.link}
      </Link>
    )
  })

  const handleSetOpenNav = (e) => {
    setOpenNav(!openNav)
  }

  return (
    <>
      <div className="flex min-w-[180px]">
        <button
          onClick={handleSetOpenNav}
          className="text-gray-700 lg:hidden"
        >
          <Icon className="h-11 w-11 fill-current" />
        </button>
        <DeskLogo />
      </div>
      <div className="items-center text-sm hidden lg:block">
        {Items}
      </div>
    </>
  )
}
