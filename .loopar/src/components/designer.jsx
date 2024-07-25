import Component from "$component";
import loopar from "$loopar";
import { Modal } from "$dialog";
import elementManage from "$tools/element-manage";
import { BrushIcon, Code2Icon, EyeIcon, SidebarOpen, StarIcon, XIcon } from "lucide-react";
import { Droppable } from "$droppable";
import { FormField } from "@form-field";
import { BaseFormContext } from "@context/form-context";
import React, { useEffect, useState } from "react";
import { DesignerContext, useDesigner } from "@custom-hooks";
import {Button} from "@/components/ui/button";
import {Tailwind} from "@publicSRC/tailwind";
import Tab from "@tab"
import Tabs from "@tabs"
import {DesignerForm} from "$tools/designer-form";
import {ElementEditor} from "$tools/element-editor";
import {Separator} from "@/components/ui/separator";
import {ScrollArea} from "@/components/ui/scroll-area";
import {useCookies} from "@services/cookie";
import {cn} from "@/lib/utils";

const Sidebar = ({updateElement, getElement}) => {
  const [, setSidebarOpen] = useCookies("sidebarOpen");
  const {currentEditElement, handleChangeMode, designerModeType} = useDesigner();
    //const sidebarOption = mode;

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
              handleChangeMode()
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
              setSidebarOpen(false)
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
            ["designer", "preview"].includes(designerModeType) ? 
            (
              <DesignerForm/>
            ) : currentEditElement && 
            (
              <DesignerContext.Provider 
                value={{}}
              >
                <ElementEditor 
                  key={currentEditElement?.data?.key} 
                  element={currentEditElement} 
                  updateElement={updateElement} 
                  getElement={getElement}
                />
              </DesignerContext.Provider>
            )
          }
          </>
        </ScrollArea>
      </div>
    </div>
  );
}

const DesignerContextProvider = ({designerRef, metaComponents, data, updateElement, getElement}) => {
  const [designing, setDesigning] = useState(false);
  const [activeId] = useState(null);
  const [currentDropZone, setCurrentDropZone] = useState(null);
  const [currentDragging, setCurrentDragging] = useState(null);
  const [editElement, setEditElement] = useCookies("editElement");
  const [dropping, setDropping] = useState(false);

  const [designerModeType, setDesignerModeType] = useCookies("designer-mode-type");

  const [sidebarOpen, setSidebarOpen] = useCookies("sidebarOpen");
  const {designerMode} = useDesigner();
  const elements = JSON.parse(metaComponents || "[]")
  const className = designerModeType !== "preview" ? " element designer design true bg-default-100" : "";
  const [IAGenerator, setIAGenerator] = useState(false);


  const handleChangeMode = (opt=null) => {
    const newMode = opt !== null ? opt
      : ["preview", "editor"].includes(designerModeType) ? "designer"
        : "preview";

    handleSetMode(newMode);
  }

  const handleSetMode = (newMode) => {
    setDesignerModeType(newMode);
  }

  const toggleDesign = (mode) => {
    setDesigning(mode !== undefined ? mode : !designing)
  }

  const handleEditElement = (element) => {
    handleChangeMode("editor");
    setEditElement(element);
  }

  const handleDeleteElement = (element) => {
    loopar.dialog({
      type: "confirm",
      title: "Delete element",
      message: "Are you sure you want to delete this element?",
      open: true,
      ok: () => {
        //Delete the element from the designer
        designerRef.deleteElement(element.data.key);
      },
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

  /*useEffect(() => {
    if(editElement){
      handleChangeMode("editor");
      setSidebarOpen(true);
    }
  }, [editElement]);*/

  //console.log(["EditElement", editElement])


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
        setDropping,
        //updateElement
        //mode
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
                  //this.setState({ IAGenerator: true, IAOperation: true });
                }}
              >
                <StarIcon className="mr-2" />
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
                {!designerMode && sidebarOpen && <Sidebar updateElement={updateElement} getElement={getElement}/>}
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


export default class MetaDesigner extends Component {
  isWritable = true;
  //__REFS__ = {};

  get droppable() { return false };
  fieldControl = {};

  static contextType = BaseFormContext;

  get requires() {
    return {
      //css: ["/assets/designer"],
      //modules: Object.values(elementsDict).filter((el) => el.def.show_in_design !== false).map((el) => el.def.element)
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      IAGenerator: false,
      IAOperation: false
    };
  }

  async prompt() {
    if (!this.promptInput) {
      loopar.throw(
        "Empty prompt",
        "Please write a prompt to send the request."
      );
      return;
    }

    if (!this.context.getValues("type")) {
      loopar.throw(
        "Empty document",
        "Please select a document to send the request."
      );
      return;
    }

    const dialog = await loopar.dialog({
      type: "info",
      title: "Wait a moment",
      content:  "Please wait for the response, this may take a few minutes.",
      buttons: [
        {
          name: "cancel",
          label: "Cancel",
          onClick: (e) => {
            this.setState({ IAOperation: false });
          },
        },
      ],
    });

    loopar
      .method("GPT", "prompt", {
        prompt: this.promptInput,
        document_type: this.context.getValues("type"),
      })
      .then((r) => {
        dialog.close();
        if (!this.state.IAOperation) return;

        const evaluateResponse = (message, start, end = start) => {
          if (message.includes(start)) {
            const startIndex = message.indexOf(start);
            const endIndex = message.lastIndexOf(end);
            return message.substring(startIndex, endIndex + end.length);
          }

          return message;
        };
        const elements = evaluateResponse(r.message, "[", "]");

        if (elementManage.isJSON(elements)) {
          this.makeElements(JSON.parse(elements));
        } else {
          this.setState({
            IAOperation: false,
          });
          loopar.dialog({
            type: "error",
            title: "Incorrect response",
            content:
              "Please resend petition to try to receive a correct format",
          });
        }
      })
      .catch((e) => {
        dialog.close();
      });
  }

 
  render() {
    const data =this.data || {};

    return (
      <FormField
        name={data.name}
        render={({ field }) => {
          return (
            <DesignerContextProvider
              metaComponents={field.value}          
              designerRef={this}
              updateElement={(key, data) => {this.updateElement(key, data)}}
              getElement={(key) => this.getElement(key)}
              data={data}
              field={field}
            />
          )}
        }
      />
    )
  }

  componentDidMount() {
    super.componentDidMount();

    const fixElements = JSON.stringify(elementManage.fixElements(
      this.#elements
    ));

    /**
     * (Fix elements) set key on each elements if not exists
     */
    if (JSON.stringify(this.#elements) !== fixElements) {
      this.hydrateForm(fixElements);
    }
  }

  updateElements(target, elements, current = null, callback) {
    const currentElements = this.#elements// JSON.parse(this.currentElements || "[]");
    const targetKey = target.data.key;
    const currentKey = current ? current.data.key : null;

    const lastParentKey = current ? current.parentKey : null;
    const selfKey = this.props.data.key;

    /**Search target in structure and set elements in target*/
    const setElementsInTarget = (structure) => {
      return structure.map((el) => {
        el.elements = el.data.key === targetKey ? elements
          : setElementsInTarget(el.elements || []);
        return el;
      });
    };

    /**Search target in structure and set elements in target, if target is self set directly in self*/
    let newElements = targetKey === selfKey ? elements
      : setElementsInTarget(currentElements, selfKey);

    /**Search current in structure and delete current in last parent*/
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

    this.hydrateForm(JSON.stringify(newElements), callback);
  }

  findElement(field, value, elements = this.#elements) {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].data[field] === value) {
        return elements[i];
      } else if (elements[i].elements) {
        const found = this.findElement(field, value, elements[i].elements);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  }

  getElement(key){
    return this.findElement("key", key);
  }

  get #elements() {
    return JSON.parse(this.context.getValues && this.context.getValues(this.props.data.name) || "[]");
  }

  makeElements(elements, callback) {
    const data = this.data;
    const fixed = elementManage.fixElements(elements);
    data.value = JSON.stringify(fixed);
    this.hydrateForm(data.value, callback);
  }

  hydrateForm(elements, callback){
    setTimeout(() => {
      this.context.setValue(this.props.data.name, elements);
      this.setState({}, callback);
    }, 0);
  }

  get elementsDict() {
    return this.#elements;
  }

  deleteElement(element) {
    const removeElement = (elements = this.#elements) => {
      return elements.filter((el) => {
        if (el.data.key === element) {
          return false;
        } else if (el.elements) {
          el.elements = removeElement(el.elements);
        }

        return true;
      }); 
    };

    this.makeElements(removeElement());
  }

  updateElement(key, data, merge = true) {
    const selfElements = this.#elements;

    if (data.name) {
      const exist = this.findElement("name", data.name, selfElements);

      if (exist && exist.data.key !== key) {
        loopar.throw(
          "Duplicate field",
          `The field with the name: ${data.name} already exists, your current field will keep the name: ${name} please check your fields and try again.`
        );
        return false;
      }
    }

    const updateElement = (structure) => {
      return structure.map((el) => {
        if (el.data.key === key) {
          el.data = merge ? Object.assign({}, el.data, data) : data;
          el.data.key ??= elementManage.getUniqueKey();
        } else {
          el.elements = updateElement(el.elements || []);
        }

        if (el.data.background_image) {
          //if(el.data.label === "Image2") console.log(["background_image", el.data.background_image])
          /*el.data.background_image = JSON.stringify(
            fileManager.getMappedFiles(el.data.background_image)
          );

          el.data.background_image = fileManager.getMappedFiles(el.data.background_image);*/
        }

        /**Purify Data */
        el.data = Object.entries(el.data).reduce((obj, [key, value]) => {
          if (
            key === "background_color" &&
            JSON.stringify(value) === '{"color":"#000000","alpha":0.5}'
          ) {
            return obj;
          }

          if (
            ![
              null,
              undefined,
              "",
              "0",
              "false",
              false,
              '{"color":"#000000","alpha":0.5}',
            ].includes(value)
          ) {
            obj[key] = value;
          }
          return obj;
        }, {});
        /**Purify Meta */

        return { element: el.element, data: el.data, elements: el.elements };
      });
    };

    this.makeElements(updateElement(selfElements));
    return true;
  }

  val() {
    return this.context.getValues(this.props.data.name);
  }

  #findDuplicateNames() {
    const elements = this.#elements;
    const [names, duplicates] = [new Set(), new Set()];

    const traverseElements = (el) => {
      if (el.data.name && names.has(el.data.name)) {
        duplicates.add(el.data.name);
      } else {
        names.add(el.data.name);
      }

      if (el.elements && el.elements.length) {
        el.elements.forEach(traverseElements);
      }
    };

    elements.forEach(traverseElements);
  }

  validate() {
    const duplicates = this.#findDuplicateNames();

    return {
      valid: !duplicates.length,
      message: `Duplicate names: ${duplicates.join(
        ", "
      )}, please check your structure.`,
    };
  }
}
