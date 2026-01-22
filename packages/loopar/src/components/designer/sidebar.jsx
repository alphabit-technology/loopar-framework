import { BrushIcon, EyeIcon, XIcon, SaveIcon, HandGrab } from "lucide-react";
import { useDesigner } from "@context/@/designer-context";
import {Button} from "@cn/components/ui/button";
import {DesignerForm} from "./designer-form";
import {ElementEditor} from "./element-editor";
import {Separator} from "@cn/components/ui/separator";
import {ScrollArea} from "@cn/components/ui/scroll-area";
import {useDocument} from "@context/@/document-context";

export const Sidebar = () => {
  const { handleSetSidebarOpen, sidebarOpen, docRef } = useDocument();
  const { handleChangeMode, designerModeType, updatingElement, dragEnabled, setDragEnable } = useDesigner();
  
  return (
    <div 
      className="w-sidebar-width mt-header-height pb-header-height bg-background dark:bg-background-dark border-l border-border dark:border-border-dark"
      style={{position: "fixed", top: 0, right: 0, zIndex: 30, width: 320, height: "100vh"}}
    >
      <div className="flex flex-col p-1 w-full h-full">
        <div className='flex gap-1 pb-1'>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleChangeMode();
            }}
          >
            {designerModeType == "designer" ? <EyeIcon/> : <BrushIcon/>}
          </Button>
          <Button 
            className={dragEnabled ? 'bg-red-500' : 'bg-secondary'}
            onClick={() => {
              setDragEnable && setDragEnable(!dragEnabled);
            }}
          >
            <HandGrab/>
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              docRef.save();
            }}
          >
            <SaveIcon className="mr-2" />
            <span>Save</span>
          </Button>
          <Button
            variant="secondary"
            className="absolute right-0"
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
        <div
          style={{height: "calc(100% - 50px)", overflowY: "auto"}}
        >
          {
            (designerModeType == "editor") ? (
              <ElementEditor key={updatingElement?.data.key}/>
            ) : <DesignerForm/>
          }
        </div>
      </div>
    </div>
  );
}
