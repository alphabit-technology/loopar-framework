import loopar from "loopar";
import { BrushIcon, BracesIcon, EyeIcon, SparkleIcon } from "lucide-react";
import { Droppable } from "@droppable";
import { BaseFormContext } from "@context/form-context";
import React, { useEffect, useState } from "react";
import { DesignerContext, useDesigner } from "@context/@/designer-context";
import {Button} from "@/components/ui/button";
import {Tailwind} from "@publicSRC/tailwind";
import Tab from "@tab";
import Tabs from "@tabs";
import {useCookies} from "@services/cookie";
import {cn} from "@/lib/utils";
import {Sidebar} from "./sidebar";

export const Designer = ({designerRef, metaComponents, data}) => {
  const [designing, setDesigning] = useState(false);
  const [activeId] = useState(null);
  const [currentDropZone, setCurrentDropZone] = useState(null);
  const [currentDragging, setCurrentDragging] = useState(null);
  const [savedEditElement, setSavedEditElement] = useCookies("editElement");
  const [editElement, setEditElement] = useState(null);
  const [dropping, setDropping] = useState(false);
  const [, setSidebarOpen] = useCookies("sidebarOpen");
  const {designerMode} = useDesigner();

  useEffect(() => {
    if(savedEditElement && designerModeType === "editor"){
      setTimeout(() => {
        handleEditElement(savedEditElement);
      }, 200);
    }
  }, []);

  const [designerModeType, setDesignerModeType] = useCookies("designer-mode-type");
  const [sidebarOpen] = useCookies("sidebarOpen");
  const elements = JSON.parse(metaComponents || "[]");

  const handleChangeMode = (opt=null) => {
    const newMode = opt !== null ? opt : (
      ["preview", "editor"].includes(designerModeType) ? "designer": "preview"
    );

    handleSetMode(newMode);
  }

  const handleSetMode = (newMode) => {
    setDesignerModeType(newMode);
  }

  const toggleDesign = (mode) => {
    setDesigning(mode !== undefined ? mode : !designing)
  }

  const handleEditElement = (element) => {
    setEditElement(element);
  }

  useEffect(() => {
    if(!designerMode){
      setSavedEditElement(editElement);
      if(editElement) handleChangeMode("editor");
    }
  }, [editElement]);
  
  useEffect(() => {
    if(editElement && designerModeType == "editor"){
      setSidebarOpen(true);
    }
  }, [editElement, designerModeType]);

  /*useEffect(() => {
    if(designerModeType !== "editor") setSavedEditElement(null);
  }, [designerModeType]);*/

  const handleDeleteElement = (element) => {
    loopar.confirm("Are you sure you want to delete this element?", () => {
      designerRef.deleteElement(element.data.key);
    });
  }

  const setMeta = (meta) => {
    if(loopar.utils.isJSON(meta)){
      designerRef.setMeta(JSON.parse(meta));
    }else{
      console.error(["Invalid JSON object", meta]);
      loopar.throw("Invalid JSON object");
    }
  }

  const handleSetMeta = (e) => {
    e.preventDefault();

    !designerMode && loopar.prompt({
      title: "META",
      label: "JSON META object",
      placeholder: "Enter a valid JSON META object",
      ok: setMeta,
      size: "lg",
      validate: (meta) => {
        !loopar.utils.isJSON(meta) && loopar.throw("Invalid JSON object");
        
        return true;
      }
    });
  }

  const handleDesingIA = (e) => {
    e.preventDefault();

    !designerMode && loopar.prompt({
      title: "Design IA",
      label: (
        <div className="relative bg-card/50 border text-card-foreground">
          <pre className="relative p-4 h-full">
            <code className="text-success w-full h-full text-pretty font-mono text-md font-bold text-green-600">
              <p className="pb-2 border-b-2">
                Based on the type of API you have contracted with OpenAI,
                you may need to wait for a specific
              </p>
              <p className="pt-2">
                Petition example: "Generate a form that allows me to
                manage inventory data."
              </p>
            </code>
          </pre>
        </div>
      ),
      ok: (prompt) => {
        loopar.send({
          action: `/desk/GPT/prompt`,
          params: { prompt, document_type: "entity" },
          body: { prompt, document_type: "entity" },
          success: (res) => {
            setMeta(res.message);
          }
        });
      },
      validate: (prompt) => {
        !prompt && loopar.throw("Please enter a valid Prompt");

        return true;
      },
      size: "lg"
    });
  }

  useEffect(() => {
    const handleMouseMove = (event) => {
      event.preventDefault();
      event.stopPropagation();
      currentDropZone && setCurrentDropZone(null);
      currentDragging && setCurrentDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseMove);
    };
  }, [currentDropZone]);

  return (
    <DesignerContext.Provider
      value={{
        designerMode: true,
        designerModeType,
        designerRef,
        designing: designerModeType === "designer" || designerModeType === "editor",
        toggleDesign,
        currentEditElement: editElement,
        handleEditElement,
        handleDeleteElement,
        activeId,
        onDraggin: false,
        setOnDragging: () => {},
        currentDropZone,
        setCurrentDropZone,
        currentDragging,
        setCurrentDragging,
        handleChangeMode,
        handleSetMode,
        dropping,
        setDropping
      }}
    >
      <BaseFormContext.Provider value={{}}>
        <div className="">
          <div className="flex w-full flex-row justify-between pt-2 px-2 pb-0">
            <div>
              <h1 className="text-xl">{data.label}</h1>
            </div>
            <div className="space-x-1">
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  !designerMode && handleChangeMode();
                }}
              >
                {designerModeType === "designer" ? <EyeIcon className="mr-2" /> : <BrushIcon className="mr-2" />}
                {designerModeType === "designer" ? "Preview" : "Design"}
              </Button>
              <Button variant="secondary" onClick={handleSetMeta}>
                <BracesIcon className="mr-2" />
                META
              </Button>
              <Button
                variant="secondary"
                onClick={handleDesingIA}
              >
                <SparkleIcon className="mr-2" />
                Design IA
              </Button>
            </div>
          </div>
          <Tabs
            data={{ name: data.name + (designerMode ? "_designer" : "_element")}}
            key={data.name + (designerMode ? "_designer" : "_element")}
            asChild
          >
            <Tab
              label={<div className="flex"><BrushIcon className="h-6 w-6 pr-2" /> Designer</div>}
              name={data.name + "designer_tab"}
              key={data.name + "designer_tab"}
            >
              <div
                className={cn("rounded border shadow-sm w-full", designerModeType === "preview" ? "p-3" : "")}
              >
                <Tailwind/>
                {!designerMode && sidebarOpen && <Sidebar/>}
                {!designerMode ?
                  <Droppable
                    className={designerModeType !== "preview" ? "min-h-20 rounded p-4" : "p-1"}
                    elements={elements}
                    data={data}
                  /> : <div className="p-6 text-center bg-card/50">Designer Area</div>
                }
              </div>
            </Tab>
            <Tab
              label={<div className="flex"><BracesIcon className="h-6 w-6 pr-2" /> META</div>}
              name={data.name + "model_tab"}
              key={data.name + "model_tab"}
            >
              <div className="text-success-500 max-h-[720px] overflow-x-auto whitespace-pre-wrap rounded border p-2 font-mono text-sm font-bold text-green-600">
                {JSON.stringify(elements, null, 2)}
              </div>
            </Tab>
          </Tabs>
        </div>
      </BaseFormContext.Provider>
    </DesignerContext.Provider>
  )
}