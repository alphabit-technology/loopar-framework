import { SideNavItem } from "./side-nav-item";
import { useWorkspace } from "@workspace/workspace-provider";
import React from "react";

export function SideNav({ sideMenuItems}) {
  const { openNav, setOpenNav, toogleSidebarNav, menuItems, currentLink, currentPage } = useWorkspace();

  const getParentLink = (page:String) => {
    return menuItems.find((item:{page:String}) => item.page === page)?.link;
  }
  
  const sideNavContent = menuItems.filter((item: { parent_menu: any; }) => !item.parent_menu).map((item, i) => {
    const childrenMenu = menuItems.filter((i: { parent_menu: any; }) => i.parent_menu == item.page);

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
      <SideNavItem
        path={`/${item.link}`}
        title={item.link}
        className="rounded-md py-2 hover:bg-slate-300/50 dark:hover:bg-slate-700/80"
        active={currentLink === item.page}
        activeParent={currentPage === item.page}
      >
        {childrenMenu.map((child, i) => {
          return (
            <div key={i} className="flex items-center ml-3 h-[30px]">
              <SideNavItem
                path={`/${item.link}/${child.link}`.replaceAll(" ", "_")}
                title={child.link}
                className="rounded-md py-2 hover:bg-slate-300/50 dark:hover:bg-slate-700/80"
                external
                active={currentLink === child.page}
              />
            </div>
          )
        })}
      </SideNavItem>
    );
  });

  return (
    <>
      {sideMenuItems.length > 0 && (
        <div
          className={`fixed inset-0 z-50 overflow-y-auto bg-popover/90 lg:bg-transparent border-r hidden lg:block w-sidebarWidth lg:top-webHeaderHeight`}
        >
          <div className="relative lg:text-sm lg:leading-6 w-sidebarWidth">
            <div className="flex flex-col gap-2 p-3 pt-5">
              {sideMenuItems.map((item, i) => {
                const parentLink = getParentLink(item.parent_menu);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <SideNavItem
                      path={`/${parentLink}/${item.link}`.replaceAll(" ", "_")}
                      title={item.link}
                      className="rounded-md py-2 hover:bg-slate-300/50 dark:hover:bg-slate-700/80"
                      external
                      active={currentLink === item.page}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      <div
        className={`fixed inset-0 z-50 overflow-y-auto duration-100 ease-in bg-popover/90 lg:bg-none  border-r lg:hidden lg:top-sidebarWidth ${openNav ? 'w-sidebarWidth' : 'w-0'}`}
      >
        {
          openNav &&
          <div
            className="fixed inset-0 backdrop-blur-sm lg:hidden" area-hidden data-headlessui-state
            onClick={() => setOpenNav(false)}
          />
        }
        <div
          className={`${openNav ? 'p-2 w-sidebarWidth' : 'p-0 w-collapseSidebarWidth'}`}
        >
          {openNav && <button
            type="button"
            className="absolute right-5 top-1 z-10 flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 lg:hidden"
            tab-index="0"
            onClick={() => setOpenNav(false)}
          >
            <span className="sr-only">Close navigation</span>
            <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 overflow-visible">
              <path d="M0 0L10 10M10 0L0 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
            </svg>
          </button>}
          <div className="relative lg:text-sm lg:leading-6">
            {openNav && <div className="pointer-events-none sticky top-0 -ml-0.5 d-none">
              <div className="pointer-events-auto relative bg-white dark:bg-slate-900">
                <button type="button" className="dark:highlight-white/5 hidden w-full items-center rounded-md py-1.5 pl-2 pr-3 text-sm leading-6 text-slate-400 shadow-sm ring-1 ring-slate-900/10 hover:ring-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 lg:flex">
                  <svg width="24" height="24" fill="none" aria-hidden="true" className="mr-3 flex-none">
                    <path d="m19 19-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    <circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
                  </svg>
                  Quick search...
                  <span className="ml-auto flex-none pl-3 text-xs font-semibold">Ctrl K</span>
                </button>
              </div>
            </div>}
            <div className="flex flex-col gap-1 p-3 pt-5">
              {sideNavContent}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}