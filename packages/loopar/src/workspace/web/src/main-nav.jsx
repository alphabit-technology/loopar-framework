import { Logo } from './logo';
import { HamburgerMenuIcon, Cross1Icon } from '@radix-ui/react-icons';
import { useWorkspace } from "@workspace/workspace-provider";
import { Link } from "@link";
import { useMemo } from "react";

export function MainNav() {
  const { openNav, setOpenNav, webApp, activeParentMenu } = useWorkspace();
  const Icon = openNav ? Cross1Icon : HamburgerMenuIcon;
  const menuItems = useMemo(() => webApp.menu_items, [webApp.menu_items]);
  const solid = useMemo(() => webApp.solid, [webApp.solid]);

  const rounded = useMemo(() => {
    return {
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    }[webApp.rounded] || "rounded-md";
  }, [webApp.rounded]);

  const Items = useMemo(() => {
    return menuItems.filter(item => !item.parent_menu).map((item, i) => {
      return (
        <Link
          className={`transition-colors px-6 py-1 ${rounded} ${!solid && 'focus:bg-transparent hover:bg-transparent bg-transparent'}`}
          active={activeParentMenu === item.page}
          key={item.id + i} 
          to={`/${item.link}`}
        >
          {item.link}
        </Link>
      )
    });
  }, [menuItems, activeParentMenu]);

  const handleSetOpenNav = (e) => {
    setOpenNav(!openNav)
  }

  return (
    <>
      <div className="flex min-w-[180px]">
        <button
          onClick={handleSetOpenNav}
          className="lg:hidden"
        >
          <Icon className="h-11 w-11 fill-current text-primary/40" />
        </button>
        <Logo />
      </div>
      <div className="flex-row items-center text-sm hidden lg:flex gap-2">
        {Items}
      </div>
    </>
  )
}
