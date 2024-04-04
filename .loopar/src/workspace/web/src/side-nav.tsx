"use client"

import { SideNavItem } from "./side-nav-item";
import { useWorkspace } from "@workspace/workspace-provider";

export interface DocsSidebarNavProps {
  items: []
}


import { Settings2Icon, SlidersIcon, UsersIcon, Globe2Icon, Code2Icon, ChevronLeftIcon} from 'lucide-react';

const icons: { [key: string]: any } = {
  "fa fa-cog": Settings2Icon,
  "fa fa-user": UsersIcon,
  "fa fa-tools": SlidersIcon,
  "fa fa-globe": Globe2Icon,
  "fa fa-oi-fork": Code2Icon,
};

export function SideNav() {
  const { sidebarWidth, collapseSidebarWidth, screenSize, openNav, setOpenNav, toogleSidebarNav, menuItems } = useWorkspace();

  const baseStyle = {
    ...(screenSize === "lg" ? {top: 65} : {}), 
    width: openNav ? sidebarWidth : (screenSize === "lg" ? collapseSidebarWidth : 0)
  }
  const content = menuItems.map((item, i) => {
    if(typeof window !== "undefined") {
      window.addEventListener("keydown", (e) => {
        if(e.ctrlKey && e.key === "k") {
          toogleSidebarNav()
        }
        if(e.key === "Escape") {
          setOpenNav()
        }
      })
    }

    return (
      <SideNavItem
        path={item.link}
        title={item.page}
        className="rounded-md py-2 hover:bg-slate-300/50 dark:hover:bg-slate-700/80"
      />
    );
  })

  const sidebarClass = screenSize === "lg" ? "" : "bg-popover/90";

  if(screenSize === "lg") return null;
  return (
    <>
      <div 
        className={`fixed inset-0 z-50 overflow-y-auto duration-100 ease-in ${sidebarClass} border-r`}
        style={baseStyle}
      >
        {
          screenSize !== "lg" && openNav && 
          <div 
            className="fixed inset-0 backdrop-blur-sm" area-hidden data-headlessui-state
            onClick={() => setOpenNav(false)}
          />
        }
        <div 
          className={`${openNav ? 'p-2' : 'p-0'}`}
          style={{ width: openNav ? sidebarWidth : collapseSidebarWidth}}
        >
          {openNav && screenSize != "lg" && <button 
            type="button" 
            className="absolute right-5 top-1 z-10 flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300" 
            tab-index="0"
            onClick={() => setOpenNav(false)}
          >
            <span className="sr-only">Close navigation</span>
            <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 overflow-visible">
              <path d="M0 0L10 10M10 0L0 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
            </svg>
          </button>}
          <div className="relative lg:text-sm lg:leading-6">
            {openNav && <div className="pointer-events-none sticky top-0 -ml-0.5">
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
            <div className="flex flex-col gap-2 p-3 pt-5">
              {content}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}