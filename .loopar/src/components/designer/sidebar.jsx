import { BrushIcon, EyeIcon, XIcon } from "lucide-react";
import React from "react";
import { useDesigner } from "@context/@/designer-context";
import {Button} from "@/components/ui/button";
import {DesignerForm} from "./designer-form";
import {ElementEditor} from "./element-editor";
import {Separator} from "@/components/ui/separator";
import {ScrollArea} from "@/components/ui/scroll-area";
import {useCookies} from "@services/cookie";

export const Sidebar = () => {
  const [, setSidebarOpen] = useCookies("sidebarOpen");
  const {currentEditElement, handleChangeMode, designerModeType} = useDesigner();

  return (
    <div 
      className="w-sidebarWidth mt-headerHeight pb-headerHeight" 
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
            {designerModeType === "designer" ? <EyeIcon className="mr-2" /> : <BrushIcon className="mr-2" />}
            <span>{designerModeType === "designer" ? "Preview" : "Design"}</span>
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSidebarOpen(false);
            }}
          >
            <XIcon className="float-right" />
          </Button>
        </div>
        <Separator/>
        <ScrollArea 
          className="h-full w-full"
        >
          <>
          {
            ["designer", "preview"].includes(designerModeType) ? (
              <DesignerForm/>
            ) : (currentEditElement) && (
              <ElementEditor 
                key={currentEditElement?.data?.key} 
                element={currentEditElement} 
              />
            )
          }
          </>
        </ScrollArea>
      </div>
    </div>
  );
}
