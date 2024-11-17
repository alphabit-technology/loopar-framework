import React from "react";
import {AppBarr} from "$context/base/app-barr";
import { useWorkspace } from "@workspace/workspace-provider";
import { MoreVertical } from "lucide-react";
import {Button} from "@/components/ui/button";
import {useCookies} from "@services/cookie";

const sidebarWidth = 300;

const InnerSidebar = ({toggleSidebar, ...props}) => {  
  return (
    <div 
      className="fixed flex flex-col right-0 h-full z-10 p-2 border-l bg-background shadow-lg transition-all"
      style={{top: "4rem", height: "calc(100% - 4rem)", width: sidebarWidth, transition: "width 0.2s"}}
    >
      <div className="flex flex-col w-full">
        <div>
          <button 
            className="absolute right-2 top-1 z-10 flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300" 
            tab-index="0"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Close navigation</span>
            <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 overflow-visible">
              <path d="M0 0L10 10M10 0L0 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
            </svg>
          </button>
        </div>
      </div>
      {props.children}
    </div>
  )
}

export default function DeskGUI(props) {
  const docRef = props.docRef;
  const {headerHeight} = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useCookies("sidebarOpen");

  const handleSetSidebarOpen = (value) => {
    setSidebarOpen(value);
  }

  const toggleSidebar = (e) => {
    e && e.preventDefault();
    handleSetSidebarOpen(!sidebarOpen);
  }

  return (
    <> 
      {docRef.hasSidebar && <Button 
        className="fixed right-0 p-1"
        variant="ghost"
        style={{top: headerHeight + "rem"}}
        onClick={toggleSidebar}
      >
        <MoreVertical/>
      </Button>}
      <div className = "flex flex-row">
        <div 
          className={`space-y-4 ${sidebarOpen ? `lg:w-[calc(100%-300px)]` : `w-full`}`}
        >
          {docRef.hasHeader && 
            <AppBarr 
              docRef={docRef} 
              meta={docRef.meta} 
              toggleSidebar={toggleSidebar}
              viewTypeToggle={props.viewTypeToggle}
              viewType={props.viewType}
              sidebarOpen={sidebarOpen}
            />
          }
          {props.children}
        </div>
        {
          sidebarOpen && 
          <InnerSidebar
            toggleSidebar={toggleSidebar}
          >
            <div>
              {docRef.getSidebarHeader && docRef.getSidebarHeader()}
            </div>
            {docRef.getSidebar && docRef.getSidebar()}
          </InnerSidebar>
        }
      </div>
    </>
  )
}
