import {AppBar} from "./app-bar";
import { useWorkspace } from "@workspace/workspace-provider";
import { MoreVertical, Save } from "lucide-react";
import {Button} from "@cn/components/ui/button";
import { useDocument, useViewOptions } from "@loopar/document";
import {cn} from "@cn/lib/utils";
import { SaveButton } from "./app-bar";

const InnerSidebar = ({ toggleSidebar, ...props }) => {
  return (
    <div
      className={cn(
        "fixed flex flex-col right-0 h-full z-10 p-2 border-l bg-background transition-all",
        "border-l border-border dark:border-border-dark",
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

export default function DeskUI(props) {
  const docRef = props.docRef;
  const { sidebarOpen, handleSetSidebarOpen, inModal } = useDocument();
  const options = useViewOptions();
  const {headerHeight} = useWorkspace();

  // No sidebar in a modal: it is `position: fixed` and would paint over the base page.
  const hasSidebar = !inModal && !!options.hasSidebar;
  const hasHeader = !!options.hasHeader;
  const hasBreadcrumb = options.hasBreadcrumb !== false;

  const toggleSidebar = (e) => {
    e && e.preventDefault();
    handleSetSidebarOpen(!sidebarOpen);
  }

  return (
    <> 
      {hasSidebar && !sidebarOpen && <Button 
        className="fixed right-0 p-1 z-10 text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
        variant="ghost"
        style={{top: headerHeight + "rem"}}
        onClick={toggleSidebar}
      >
        <MoreVertical/>
      </Button>}
      <div 
        className={`flex flex-col flex-1 space-y-4 ${sidebarOpen ? "" : "w-full"}`}
      >
        {hasHeader && 
          <AppBar 
            Document={docRef.Document}
            toggleSidebar={toggleSidebar}
            viewTypeToggle={props.viewTypeToggle}
            viewType={props.viewType}
            sidebarOpen={sidebarOpen}
            hasBreadcrumb={hasBreadcrumb}
          />
        }
        {props.children}
      </div>
      {
        hasSidebar && sidebarOpen && 
        <InnerSidebar toggleSidebar={toggleSidebar}>
          <div>
            {options.sidebarHeader}
            <SaveButton/>
          </div>
          {options.sidebar}
        </InnerSidebar>
      }
    </>
  )
}
