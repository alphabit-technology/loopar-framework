import loopar from "loopar";
import { BrushIcon, BracesIcon, EyeIcon, SparkleIcon, Eye } from "lucide-react";
import { Droppable } from "@droppable";
import { BaseFormContext } from "@context/form-provider";
import React, { useEffect, useState } from "react";
import { DesignerContext, useDesigner } from "@context/@/designer-context";
import {Button} from "@cn/components/ui/button";
import {Tailwind} from "@publicSRC/tailwind";
import Tab from "@tab";
import Tabs from "@tabs";
import {useCookies} from "@services/cookie";
import {cn} from "@cn/lib/utils";
import { Sidebar } from "./sidebar";
import {useDocument} from "@context/@/document-context";

import elementManage from "@@tools/element-manage";

import Emitter from '@services/emitter/emitter';
import { set } from "../../../core/global/cookie-manager";

export const Designer = ({designerRef, metaComponents, data, ...props}) => {
  const [activeId] = useState(null);
  const [currentDropZone, setCurrentDropZone] = useState(null);
  const [currentDragging, setCurrentDragging] = useState(null);
  const [dropping, setDropping] = useState(false);
  const {designerMode} = useDesigner();
  const { name, sidebarOpen, handleSetSidebarOpen} = useDocument();
  
  const [editElement, setEditElement] = useCookies(name + "editElement");
  const [designerModeType = "designer", setDesignerModeType] = useCookies(name + "designer-mode-type");
  //const [elements, setElements] = useState(JSON.parse(metaComponents || "[]"))
  const elements = JSON.parse(metaComponents || "[]");

  const handleChangeMode = (opt=null) => {
    const newMode = opt !== null ? opt : (
      ["preview", "editor"].includes(designerModeType) ? (!sidebarOpen ? "preview" : "designer"): "preview"
    );

    handleSetMode(newMode);
  }

  useEffect(() => {
    //setElements(JSON.parse(metaComponents || "[]"))
  }, [metaComponents])

  const handleSetMode = (newMode) => {
    setDesignerModeType(newMode);
    handleSetSidebarOpen(true);
  }

  useEffect(() => {
    if (designerMode) return;

    if (!editElement || editElement == "null") {
      handleSetMode("designer");
    } else if (!findElement("key", editElement)) {
      setEditElement(null);
    }
  }, []);

  
  const getElements = () => {
    return JSON.parse(metaComponents || "[]");
  }

  const findElement = (field, value, elements = getElements()) => {
    if (!value || value === "null" || value.length == 0) return null;
    
    for (let i = 0; i < elements.length; i++) {
      if (elements[i]?.data?.[field] === value) {
        return elements[i];
      } else if (Array.isArray(elements[i]?.elements)) {
        const found = findElement(field, value, elements[i].elements);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const updateElements = (target, elements, current = null) => {
    const currentElements = getElements();
    const targetKey = target.data.key;
    const currentKey = current ? current.data.key : null;

    const lastParentKey = current ? current.parentKey : null;
    const selfKey = data.key;

    //Search target in structure and set elements in target
    const setElementsInTarget = (structure) => {
      return structure.map((el) => {
        el.elements = el.data.key === targetKey ? elements
          : setElementsInTarget(el.elements || []);
        return el;
      });
    };

    //Search target in structure and set elements in target, if target is self set directly in self
    let newElements = targetKey === selfKey ? elements
      : setElementsInTarget(currentElements, selfKey);

    //Search current in structure and delete current in last parent
    const deleteCurrentOnLastParent = (structure, parent) => {
      if (lastParentKey === parent) {
        return structure.filter((e) => e.data.key !== currentKey);
      }

      return structure.map((el) => {
        el.elements = deleteCurrentOnLastParent(el.elements || [], el.data.key);
        return el;
      });
    };

    if (current && lastParentKey !== targetKey) {
      newElements = deleteCurrentOnLastParent(newElements, selfKey);
    }

    setMeta(JSON.stringify(newElements));
  }

  const updateElement = (key, data, merge = true) => {
    const selfElements = getElements();

    if (data.name) {
      const exist = findElement("name", data.name, selfElements);

      if (exist && exist.data.key !== key) {
        loopar.throw(
          "Duplicate field",
          `The field with the name: ${data.name} already exists, your current field will keep the name: ${data.name} please check your fields and try again.`
        );
        return false;
      }
    }

    const updateE = (structure) => {
      return structure.map((el) => {
        if (el.data.key === key) {
          el.data = merge ? Object.assign({}, el.data, data) : data;
          el.data.key ??= elementManage.getUniqueKey();
        } else {
          el.elements = updateE(el.elements || []);
        }

        /**Purify Data */
        el.data = Object.entries(el.data).reduce((obj, [key, value]) => {
          if (
            key === "background_color" &&
            JSON.stringify(value) === '{"color":"#000000","alpha":0.5}'
          ) {
            return obj;
          }

          if (![null,undefined,"","0","false",false,'{"color":"#000000","alpha":0.5}',].includes(value)) {
            obj[key] = value;
          }
          return obj;
        }, {});
        /**Purify Meta */

        return { element: el.element, data: el.data, elements: el.elements };
      });
    };

    props.onChange({target: {value: JSON.stringify(updateE(selfElements))}});
    Emitter.emit("currentElementEdit", data.key);
  }

   const getElement = (key) => {
    return findElement("key", key);
  }

  const deleteElement = (element) => {
    const removeElement = (elements = getElements()) => {
      return elements.filter((el) => {
        if (el.data.key === element) {
          return false;
        } else if (el.elements) {
          el.elements = removeElement(el.elements);
        }

        return true;
      });
    };

    setMeta(JSON.stringify(removeElement()));
  }

  const handleEditElement = (element) => {
    setEditElement(element);
    handleChangeMode("editor");
  }

  const handleDeleteElement = (element) => {
    loopar.confirm("Are you sure you want to delete this element?", () => {
      deleteElement(element.data.key);
    });
  }

  const setMeta = (meta) => {
    if(loopar.utils.isJSON(meta)){
      props.onChange(meta);
      //designerRef.setMeta(JSON.parse(meta));
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
            <code className="w-full h-full text-pretty font-mono text-md font-bold text-green-600">
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

  // useEffect(() => {
  //   if (designerMode) return;

  //   const handleMouseMove = (event) => {
  //     event.preventDefault();
  //     event.stopPropagation();
  //     currentDropZone && setCurrentDropZone(null);
  //     currentDragging && setCurrentDragging(null);
  //   };

  //   document.addEventListener('mouseup', handleMouseMove);

  //   return () => {
  //     document.removeEventListener('mouseup', handleMouseMove);
  //   };
  // }, [currentDropZone]);

  useEffect(() => {
    if (designerMode) return;
    
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

  const getDesignerButton = () => {
    if (designerModeType == "preview") {
      return <><BrushIcon className="mr-2" /> Design</>
    }
  
    if (designerModeType == "editor") {
      if (sidebarOpen) {
        return <><BrushIcon className="mr-2" /> Design</>
      } else {
        return <><EyeIcon className="mr-2" /> Preview</>
      }
    }

    if (designerModeType == "designer") {
      return <><EyeIcon className="mr-2" /> Preview</>
    }
  }

  return (
    <DesignerContext.Provider
      value={{
        designerMode: !designerMode, //Detect if self context is designer
        designerModeType,
        designerRef: {
          updateElements,
          updateElement,
        },
        updateElement,
        getElement,
        designing: designerModeType === "designer" || designerModeType === "editor",
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
              <h2 className="text-3xl">{data.label}</h2>
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
                {getDesignerButton()}
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
                {(!designerMode && sidebarOpen) && <Sidebar/>}
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