"use client"

import { SideNavItem } from "./side-nav-item";
import { useWorkspace } from "@workspace/workspace-provider";
import * as LucideIcons from "lucide-react";
import {useId} from "react";

export interface DocsSidebarNavProps {
  items: []
}

export interface SideNavProps {
  items: []
};

import { useEffect } from "react";

export function SideNav({ items=[] }: SideNavProps) {
  const { openNav, setOpenNav, toogleSidebarNav } = useWorkspace();

  const sideNavItems = items.map((item, i) => {
    const { description, modules = [] } = item
    const hasSubitems = modules && modules.length > 0

    return (
      <li key={useId()}>
        <h5
          className="mb-1 mt-3 font-semibold text-slate-900 dark:text-slate-200"
        >
          {openNav && description}
        </h5>
        <div>
          {hasSubitems && (
            <ul className="flex flex-col gap-1 px-1">
              {...modules.map((module:any, key) => {
                const active = module.link ? true : false;

                return (
                  <SideNavItem
                    active={active}
                    disabled={module.disabled}
                    external={module.external}
                    Icon={LucideIcons[module.icon] || LucideIcons.ChevronLeftIcon}
                    
                    path={module.link}
                    title={module.description}
                    compact={!openNav}
                    className="rounded-md py-2 hover:bg-slate-300/50 dark:hover:bg-slate-700/80"
                  />
                );
              })}
            </ul>
          )}
        </div>
      </li>
    )
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "k") {
          toogleSidebarNav()
        }
        if (e.key === "Escape") {
          setOpenNav()
        }
      })

      return () => {
        window.removeEventListener("keydown", () => {})
      }
    }
  }, [])

  return (
    <>
      <div 
        className={`fixed inset-0 z-50 overflow-y-auto duration-100 ease-in bg-popover/90 lg:bg-transparent border-r lg:top-header-height ${openNav ? 'w-sidebar-width lg:w-sidebar-width p-2' : 'w-0 lg:w-collapse-sidebar-width'}`}
      >
        <div 
          className={`fixed inset-0 backdrop-blur-sm ${!openNav && "hidden" } lg:hidden`}
          area-hidden 
          data-headlessui-state
          onClick={() => setOpenNav(false)}
        />
        <div 
          className="w-full"
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
            {openNav && <div className="pointer-events-none sticky top-0 -ml-0.5 hidden">
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
            <ul>
              {sideNavItems}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}