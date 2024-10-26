import { SideNavItem } from "./side-nav-item";
import { useWorkspace } from "@workspace/workspace-provider";
import React from "react";
import { cn } from "@/lib/utils";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Item } from "@radix-ui/react-context-menu";

type Items = Array<Item>

type Item = {
  link: String,
  page: String,
  parent_menu: String,
  items: Items
}

const getActive = (item: Item, activePage: String) => {
  if (item.page == activePage) return true;

  for (const i of item.items) {
    if(getActive(i, activePage)){
      return true;
    }
  }

  return false;
}

const MenuItemTree = ({item, isChild = false}={item:Item, isChild:Boolean}) => {
  const { menuItems, activePage, activeParentMenu } = useWorkspace();

  const getParentLink = () => {
    return menuItems.find((item: Item) => item.page === activeParentMenu)?.link;
  }

  const getLink = (item: Item) => {
    const parentLink = getParentLink();
    return parentLink === item.page ? `/${item.link}` : `/${parentLink}/${item.link}`;
  }

  const treeIsActive = getActive(item, activePage);

  return (
    <>
      <SideNavItem
        path={getLink(item)}
        title={item.link}
        className={`rounded-md pl-0 pt-0`}
        active={treeIsActive}
        hasChildren={item.items.length > 0}
        isChild={isChild}
      >
        {treeIsActive && (
          <div className={`pl-3 ${isChild ? '' : ''}`}>
            {item.items.map((subItem:Item) => (
              <>
                <MenuItemTree key={subItem.page} item={subItem} isChild={true}/>
              </>
            ))}
          </div>
        )}
      </SideNavItem>
    </>
  );
};

const SideNavRender = ({ menu }) => {
  return (
    <div className="w-full">
      {menu.map((item:Item) => (
        <MenuItemTree key={item.page} item={item}/>
      ))}
    </div>
  );
}

export function SideNav({sideMenuItems}) {
  const { openNav, setOpenNav, toogleSidebarNav, activeParentMenu } = useWorkspace();
  const baseClassName = `fixed inset-0 z-50 overflow-y-auto bg-popover/90 lg:bg-transparent border-r ${openNav ? 'w-webSidebarWidth px-2' : 'w-0'} lg:top-webHeaderHeight`

  if (typeof window !== "undefined") {
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "k") {
        toogleSidebarNav()
      }
      if (e.key === "Escape") {
        setOpenNav()
      }
    })
  }

  const childMenuItems = sideMenuItems.find(item => item.page === activeParentMenu)?.items || [];

  return (
    <>
      <div className={cn(baseClassName, "lg:hidden")}>
        <>
          {openNav && (
            <>
              <div
                className="fixed inset-0 backdrop-blur-sm"
                onClick={() => setOpenNav(false)}
              />
              <button
                type="button"
                className="absolute right-5 top-1 z-10 flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
                tab-index="0"
                onClick={() => setOpenNav(false)}
              >
                <span className="sr-only">Close navigation</span>
                <Cross1Icon />
              </button>
            </>
          )}
          <div className="relative lg:text-sm lg:leading-6 pt-10 w-full">
            <SideNavRender menu={sideMenuItems} />
          </div>
        </>
      </div>
      {childMenuItems.length > 0 && <div className={cn(baseClassName, "hidden lg:block w-webSidebarWidth p-2")}>
        <>
          <SideNavRender menu={childMenuItems} />
        </>
      </div>}
    </>
  );
}