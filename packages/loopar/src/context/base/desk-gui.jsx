import React from "react";
import {AppBarr} from "@context/base/app-barr";
import { useWorkspace } from "@workspace/workspace-provider";
import { MoreVertical } from "lucide-react";
import {Button} from "@cn/components/ui/button";
import { useDocument } from "@context/@/document-context";
import {cn} from "@cn/lib/utils";

const InnerSidebar = ({ toggleSidebar, sidebarWidth, ...props }) => {  
  return (
    <div 
      className={cn(
        "fixed flex flex-col right-0 h-full z-10 p-2 border-l bg-background transition-all",
        "border-l border-border dark:border-border-dark",
        sidebarWidth
      )}
      style={{top: "4rem", height: "calc(100% - 4rem)", transition: "width 0.2s"}}
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
  const { sidebarOpen, handleSetSidebarOpen, sidebarWidth, documentWidth} = useDocument();
  const {headerHeight} = useWorkspace();


  const toggleSidebar = (e) => {
    e && e.preventDefault();
    handleSetSidebarOpen(!sidebarOpen);
  }

  return (
    <> 
      {docRef.__hasSidebar__ && !sidebarOpen && <Button 
        className="fixed right-0 p-1"
        variant="ghost"
        style={{top: headerHeight + "rem"}}
        onClick={toggleSidebar}
      >
        <MoreVertical/>
      </Button>}
      <div 
        className={`flex flex-col flex-1 space-y-4 ${sidebarOpen ? documentWidth : `w-full`}`}
      >
        {docRef.__hasHeader__ && 
          <AppBarr 
            docRef={docRef} 
            meta={docRef.meta} 
            toggleSidebar={toggleSidebar}
            viewTypeToggle={props.viewTypeToggle}
            viewType={props.viewType}
            sidebarOpen={sidebarOpen}
            hasBreadcrumb={docRef.__hasBreadcrumb__}
          />
        }
        {props.children}
      </div>
      {
        docRef.__hasSidebar__ && sidebarOpen && 
        <InnerSidebar
          sidebarWidth={sidebarWidth}
          toggleSidebar={toggleSidebar}
        >
          <div>
            {docRef.getSidebarHeader && docRef.getSidebarHeader()}
          </div>
          {docRef.getSidebar && docRef.getSidebar()}
        </InnerSidebar>
      }
    </>
  )
}
