"use client"

import { SideNavItem } from "./side-nav-item";
import { useWorkspace } from "@workspace/workspace-provider";
import {ChevronLeftIcon} from "lucide-react";
import { useId, useEffect } from "react";

export function SideNav({ items=[] }) {
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
              {...modules.map((module, key) => {
                const active = module.link ? true : false;

                return (
                  <SideNavItem
                    active={active}
                    disabled={module.disabled}
                    external={module.external}
                    icon={module.icon}
                    DefaultIcon={ChevronLeftIcon}
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
    <div 
      className={`fixed inset-0 z-50 duration-100 ease-in bg-popover/90 lg:bg-transparent border-r lg:!top-header-height ${openNav ? '!w-sidebar-width lg:!w-sidebar-width' : 'w-0 lg:!w-collapse-sidebar-width'}`}
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
          <ul className={`overflow-auto h-[calc(100vh-theme('spacing.header-height'))] flex flex-1 flex-col gap-y-5 border-t-2 border-t-slate-200/10 ${openNav ? 'px-2' : ''}`}>
            {sideNavItems}
          </ul>
        </div>
      </div>
    </div>
  )
}