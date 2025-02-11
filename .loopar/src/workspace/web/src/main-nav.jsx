import { Logo } from './logo';
import { HamburgerMenuIcon, Cross1Icon } from '@radix-ui/react-icons';
import { useWorkspace } from "@workspace/workspace-provider";
import { Link } from "@link";

export function MainNav() {
  const { openNav, setOpenNav, webApp, activeParentMenu } = useWorkspace();
  const Icon = openNav ? Cross1Icon : HamburgerMenuIcon;
  const menuItems = webApp.menu_items;
  const rounded = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[webApp.rounded];

  const Items = menuItems.filter((item) => !item.parent_menu).map((item, i) => {
    return (
      <Link
        className={`transition-colors px-6 py-1 ${rounded}`}
        active={activeParentMenu === item.page}
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
