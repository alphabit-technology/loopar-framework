import { BrushIcon, EyeIcon, XIcon } from "lucide-react";
import React, {useEffect} from "react";
import { useDesigner } from "@context/@/designer-context";
import {Button} from "@cn/components/ui/button";
import {DesignerForm} from "./designer-form";
import {ElementEditor} from "./element-editor";
import {Separator} from "@cn/components/ui/separator";
import {ScrollArea} from "@cn/components/ui/scroll-area";
import {useDocument} from "@context/@/document-context";

export const Sidebar = () => {
  const { handleSetSidebarOpen, sidebarOpen } = useDocument();
  const { currentEditElement, handleChangeMode, designerModeType } = useDesigner();
  
  return (
    <div 
      className="w-sidebar-width mt-header-height pb-header-height"
      style={{position: "fixed", top: 0, right: 0, zIndex: 30, width: 300, height: "100vh"}}
    >
      <div className="flex flex-col p-1 w-full h-full">
        <div className='flex justify-between pb-1'>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleChangeMode();
            }}
          >
            {designerModeType == "designer" ? <EyeIcon className="mr-2" /> : <BrushIcon className="mr-2" />}
            <span>{designerModeType == "designer" && sidebarOpen ? "Preview" : "Design"}</span>
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSetSidebarOpen(false);
            }}
          >
            <XIcon className="float-right" />
          </Button>
        </div>
        <Separator/>
        <ScrollArea 
          className="h-full w-full"
          style={{height: "calc(100% - 50px)", overflowY: "auto"}}
        >
          {
            (currentEditElement && currentEditElement != "null" && designerModeType == "editor") ? (
              <ElementEditor 
                key={currentEditElement + "_editor"} 
                element={currentEditElement} 
              />
            ) : <DesignerForm/>
          }
        </ScrollArea>
      </div>
    </div>
  );
}
