import loopar from "$loopar";
import { Modal } from "$dialog";
import { BrushIcon, Code2Icon, EyeIcon, StarIcon, Loader } from "lucide-react";
import { Droppable } from "$droppable";
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
  
  const elements = JSON.parse(metaComponents || "[]")
  //const className = designerModeType !== "preview" ? " element designer design true bg-default-100" : "";
  const [IAGenerator, setIAGenerator] = useState(false);


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
        <div className="rounded-sm">
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
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Loader className="mr-2" />
                Design IA
              </Button>
              <Modal
                title="IA Generator via CHAT GPT-3.5"
                icon={<span className="fa fa-magic pr-2 text-success" />}
                size="md"
                open={IAGenerator}
                scrollable
                buttons={[
                  {
                    name: "send",
                    label: "Send",
                    onClick: (e) => {
                      this.prompt();
                    },
                    internalAction: "close",
                  },
                ]}
                onClose={(e) => {
                  setIAGenerator(false);
                }}
              >
                <div className="flex flex-col gap-2">
                  <div className="relative bg-card/50 rounded-lg border text-card-foreground">
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
                  <textarea
                    name="PROMPT"
                    rows={20}
                    onChange={(ref) => {
                      //this.promptInput = ref.target.value;
                    }}
                    className="bg-transparent w-full h-50 border border-input rounded-md p-2"
                  />
                </div>
              </Modal>
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
                className={cn("rounded-md border bg-card/50 text-card-foreground shadow-sm w-full", designerModeType === "preview" ? "p-3" : "")}
              >
                <Tailwind/>
                {!designerMode && sidebarOpen && <Sidebar/>}
                {!designerMode ?
                  <Droppable
                    className={designerModeType !== "preview" ? "min-h-20 rounded-md bg-gray-300/80 dark:bg-slate-800/70 dark:text-gray-200 p-4" : "p-1"}
                    elements={elements}
                    data={data}
                  /> : <div className="p-6 text-center text-gray-400 bg-slate-800/50"/>
                }
              </div>
            </Tab>
            <Tab
              label={<div className="flex"><Code2Icon className="h-6 w-6 pr-2" /> JSON</div>}
              name={data.name + "model_tab"}
              key={data.name + "model_tab"}
            >
              <div className="text-success-500 max-h-[720px] overflow-x-auto whitespace-pre-wrap rounded-lg border p-2 font-mono text-sm font-bold text-green-600">
                {JSON.stringify(elements, null, 2)}
              </div>
            </Tab>
          </Tabs>
        </div>
      </BaseFormContext.Provider>
    </DesignerContext.Provider>
  )
}