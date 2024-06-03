import { SideNavItem } from "./side-nav-item";
import { useWorkspace } from "@workspace/workspace-provider";
import React from "react";
import { Link } from "$link";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DotFilledIcon } from "@radix-ui/react-icons";

import { buttonVariants } from "@/components/ui/button";

type Item = {
  link: String,
  page: String,
  parent_menu: String,
  items: Array<Item>
}

const SideNavRender = ({items}) => {
  const { menuItems, currentLink, currentPage } = useWorkspace();

  const getParentLink = (page: String) => {
    return menuItems.find((item: Item) => item.page === page)?.link;
  }

  const groupMenu = items.reduce((acc:Array<Item>, i:Item) => {
    i.items = menuItems
      .filter((_i: Item) => _i.parent_menu == i.page)

    if (!acc.find((_i: Item) => _i.page == i.page)) {
      acc.push(i);
    }
    return acc;
  }, []);

  return groupMenu.map((item:Item) => {
    const parentLink = getParentLink(item.parent_menu);
    const link = item.link.replaceAll(" ", "_");
    const path = parentLink ? `/${parentLink}/${link}` : `/${link}`;
    const subItems = item.items.filter((i: Item) => !groupMenu.find((_i: Item) => _i.link === i.link));

    return (
      <SideNavItem
        path={path}
        title={item.link}
        className={`rounded-md pl-0 bg-red-400`}
        active={currentLink === item.page || subItems.some((i:Item) => (i.page == currentLink && i.parent_menu == item.page))}
      >
        {subItems.map((child:Item) => {
          const active = currentLink === child.page;
          const activeText = active ? "text-primary/80" : "text-slate-500/70 hover:text-slate/70";
          return (
            <Link
              className={`block border-l ml-4 pl-3 my-0 ${activeText} font-semibold rounded-none w-full h-7`}
              to={`/${item.link}/${child.link}`.replaceAll(" ", "_")}
            >
              {active && <DotFilledIcon className="w-6 h-6 inline-block -ml-6" />}
              <button
                className={`transition-colors hover:text-foreground/80`}
              >
                {child.link}
              </button>
            </Link>
          );
        })}
      </SideNavItem>
    );
  });
}

export function SideNav({ sideMenuItems}) {
  const { openNav, setOpenNav, toogleSidebarNav, menuItems } = useWorkspace();
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
                <XIcon />
              </button>
            </>
          )}
          <div className="relative lg:text-sm lg:leading-6 pt-10 w-full">
            <SideNavRender items={menuItems.filter(item => !item.parent_menu)} />
          </div>
        </>
      </div>
      {sideMenuItems.length > 0 && <div className={cn(baseClassName, "hidden lg:block w-webSidebarWidth p-2")}>
        <>
          <SideNavRender items={sideMenuItems} />
        </>
      </div>}
    </>
  )
}