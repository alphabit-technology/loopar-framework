import { Logo } from './logo';
import { HamburgerMenuIcon, Cross1Icon } from '@radix-ui/react-icons';
import { useWorkspace } from "@workspace/workspace-provider";
import { Link } from "@link";

export function MainNav() {
  const { openNav, setOpenNav, webApp, activeParentMenu } = useWorkspace();
  const Icon = openNav ? Cross1Icon : HamburgerMenuIcon;
  const menuItems = webApp.menu_items;

  const Items = menuItems.filter((item) => !item.parent_menu).map((item, i) => {
    const active = activeParentMenu === item.page ? "text-foreground/100 bg-foreground/10 px-2" : "px-2";
    return (
      <Link
        className={`transition-colors hover:text-foreground/80 text-foreground/60 px-2 py-1 rounded-full ${active}`}
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
        <Logo />
      </div>
      <div className="items-center text-sm hidden lg:block">
        {Items}
      </div>
    </>
  )
}
