import loopar from "loopar";
import { BrushIcon, BracesIcon, EyeIcon, SparkleIcon } from "lucide-react";
import { BaseFormContext } from "@context/form-provider";
import { useCallback, useEffect, useState } from "react";
import { DesignerContext, useDesigner } from "@context/@/designer-context";
import {Button} from "@cn/components/ui/button";
import Tab from "@tab";
import Tabs from "@tabs";
import {useCookies} from "@services/cookie";
import {cn} from "@cn/lib/utils";
import { Sidebar } from "./sidebar";
import {useDocument} from "@context/@/document-context";
import elementManage from "@@tools/element-manage";
import {DragAndDropProvider} from "../droppable/DragAndDropContext.jsx";
import {Prompt} from "./src/prompt/Prompt.jsx";
import MarkdownPreview from '@uiw/react-markdown-preview';
import {elementsNames} from "@global/element-definition"

const updateE = (structure, data, key, merge) => {
  return [...structure].map((el) => {
    if (!el.data) return el;

    if(!elementsNames.includes(el.element)) {
      el.data.tag = el.element;
      el.element = "generic";
    }
    
    if (el.data.key === key) {
      el.data = merge ? Object.assign({}, el.data, data) : data;
      el.data.key ??= elementManage.getUniqueKey();
    } else {
      el.elements = updateE(el.elements || [], data, key, merge);
    }

    return {...el};
  });
};

const fixMeta = (structure) => {

  return [...structure].map((el) => {
    el.data ??= {}
    el.data.key ??= elementManage.getUniqueKey();
    el.data.id ??= el.data.key;
    el.data.name ??= el.data.key;
    el.data.label ??= loopar.utils.Capitalize((el.data.name || el.data.key).replaceAll("_", " "));

    el.elements = fixMeta(el.elements || []);

    return {...el};
  });
}

const DesignerButton = () => {
  const { designerMode, designerModeType } = useDesigner();
  const { sidebarOpen } = useDocument();

  if (!designerMode || designerModeType == "preview") {
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

export const BaseDesigner = (props) => {
  const {data, metaComponents} = props;
  const [activeId] = useState(null);
  const {designerMode} = useDesigner();
  const {name, sidebarOpen, handleSetSidebarOpen} = useDocument();

  const [updatingElementName, setUpdatingElementName] = useCookies(name + "updatingElementName");
  const [designerModeType, setDesignerModeType] = useCookies(name + "designer-mode-type");
  const [sendingPrompt, setSendingPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("Generate a form that allows me to manage inventory data");

  const selfKey = data.key;

  const handleChangeMode = (opt=null) => {
    const newMode = opt !== null ? opt : (
      ["preview", "editor"].includes(designerModeType) ? (!sidebarOpen ? "preview" : "designer"): "preview"
    );

    handleSetMode(newMode);
  }

  const handleSetMode = (newMode) => {
    setDesignerModeType(newMode);
    handleSetSidebarOpen(true);
  }
  
  useEffect(() => {
    if (designerMode) return;

    if (!updatingElementName || updatingElementName == "null") {
      handleSetMode("designer");
    }else if (!findElement("key", updatingElementName)) {
      setUpdatingElementName(null);
    }
  }, []);

  const findElement = useCallback((field, value, els = metaComponents) => {
    if (!value || value == "null" || value.length == 0 || !els) return null;

    for (let i = 0; i < els.length; i++) {
      if (els[i]?.data?.[field] == value) {
        return els[i];
      } else if (Array.isArray(els[i]?.elements)) {
        const found = findElement(field, value, els[i].elements || []);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  }, [metaComponents]);

  const [updatingElement, setUpdatingElement] = useState(findElement("key", updatingElementName));

  useEffect(() => {
    setUpdatingElement(findElement("key", updatingElementName, metaComponents));
  }, [updatingElementName, metaComponents]);

  const updateElements = (target, elements, current = null) => {
    const currentElements = metaComponents;
    const targetKey = target.data.key;
    const currentKey = current ? current.data.key : null;
    const lastParentKey = current ? current.parentKey : null;

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
        return structure.filter(e => e.data.key !== currentKey);
      }

      return structure.map(el => {
        el.elements = deleteCurrentOnLastParent(el.elements || [], el.data.key);
        return el;
      });
    };

    if (current && lastParentKey !== targetKey) {
      newElements = deleteCurrentOnLastParent(newElements, selfKey);
    }

    setMeta(JSON.stringify(newElements));
  }

  const updateElement = (key, data, merge = true, fromEditor=false) => {
    const selfElements = [...metaComponents];

    if (data.name) {
      const exist = findElement("name", data.name, selfElements);

      if (exist && exist.data.key !== key) {
        return loopar.throw(
          "Duplicate field",
          `The field with the name: ${data.name} already exists, your current field will keep the name: ${data.name} please check your fields and try again.`,
          false
        );
      }
    }

    setMeta(JSON.stringify(updateE(selfElements, data, key, merge)));

    if (key === updatingElementName && !fromEditor) {
      setUpdatingElement({
        ...updatingElement,
        data: {...data},
        __version__: (updatingElement.__version__ || 0) + 1
      });
    }
  }

  const deleteElement = (element) => {
    const removeElement = (elements = metaComponents) => {
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
    setUpdatingElementName(element);
    handleChangeMode("editor");
  }

  const handleDeleteElement = (element) => {
    loopar.confirm("Are you sure you want to delete this element?", () => {
      deleteElement(element);
    });
  }

  const setMeta = (meta) => {
    if(loopar.utils.isJSON(meta)){
      props.onChange(JSON.stringify(fixMeta(JSON.parse(meta))));
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

  const isDesigner = typeof designerMode != "undefined" ? !designerMode : true;

  return (
    <DesignerContext.Provider
      value={{
        designerMode: isDesigner,
        designerModeType,
        designerRef: {
          updateElements,
          updateElement,
        },
        updateElements,
        updateElement,
        designing: (designerModeType === "designer" || designerModeType === "editor"),
        updatingElement,
        handleEditElement,
        handleDeleteElement,
        activeId,
        handleChangeMode,
        handleSetMode,
      }}
    >
      <BaseFormContext.Provider value={{}}>
        <div className="">
            <Prompt 
              defaultPrompt={currentPrompt} 
              open={sendingPrompt} 
              onClose={() => setSendingPrompt(false)}
              onComplete={setMeta}
            />
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
                <DesignerButton/>
              </Button>
              <Button variant="secondary" onClick={handleSetMeta}>
                <BracesIcon className="mr-2" />
                META
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSendingPrompt(true)}
              >
                <SparkleIcon className="mr-2" />
                Design AI
              </Button>
            </div>
          </div>
          <Tabs
            data={{ name: selfKey}}
            key={selfKey}
            asChild={true}
            canCustomize={false}
          >
            <Tab
              label={<div className="flex"><BrushIcon className="h-6 w-6 pr-2" /> Designer</div>}
              name={`${selfKey}-designer_tab`}
              key={`${selfKey}-designer_tab`}
            >
              <div
                className={cn("rounded border shadow-sm w-full", designerModeType === "preview" ? "p-3" : "")}
              >
                <DragAndDropProvider 
                  metaComponents={metaComponents} 
                  data={data}
                  onDrop={setMeta}
                >
                  {sidebarOpen && <Sidebar/>}
                </DragAndDropProvider>
              </div>
            </Tab>
            <Tab
              label={<div className="flex"><BracesIcon className="h-6 w-6 pr-2" /> META</div>}
              name={`${selfKey}-meta_tab`}
              key={`${selfKey}-meta_tab`}
            >
              <div className="max-h-[720px] overflow-x-auto">
                <div
                  className="contents w-full prose dark:prose-invert"
                >
                  <MarkdownPreview source={`\`\`\`jsx\n${JSON.stringify(metaComponents, null, 2)}\n\`\`\``} />
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </BaseFormContext.Provider>
    </DesignerContext.Provider>
  )
}

export const Designer = (props) => {
  const {designerMode} = useDesigner();
  if (!designerMode) {
    return <BaseDesigner {...props} />
  }

  const {data} = props;
  
  return (
    <div className="">
      <div className="flex w-full flex-row justify-between pt-2 px-2 pb-0">
        <div>
          <h2 className="text-3xl">{data.label}</h2>
        </div>
        <div className="space-x-1 pointer-events-none">
          <Button variant="secondary">
            <BrushIcon className="mr-2" />
            Design
          </Button>
          <Button variant="secondary">
            <BracesIcon className="mr-2" />
            META
          </Button>
          <Button
            variant="secondary"
          >
            <SparkleIcon className="mr-2" />
            Design AI
          </Button>
        </div>
      </div>
      <div className="w-full p-2">
        <div className="flex items-center bg-slate-700/50 justify-center h-[60px]">
          <h1 className="text-center text-2xl font-bold">Design area</h1>
        </div>
      </div>
    </div>
  )
}