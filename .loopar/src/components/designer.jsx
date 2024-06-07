import Component from "$component";
import loopar from "$loopar";
import { Modal } from "$dialog";
import elementManage from "$tools/element-manage";
import MetaComponent from "@meta-component";
import { BrushIcon, Code2Icon, EyeIcon, StarIcon } from "lucide-react";
import { Droppable } from "$droppable";
import { FormField } from "@form-field";
import { BaseFormContext } from "@context/form-context";
import React, { useState } from "react";
import { useDocument, DesignerContext } from "@custom-hooks";
import { elementsDict } from "@global/element-definition";
import {Button} from "@/components/ui/button";
import {Tailwind} from "@publicSRC/tailwind";
import Tab from "@tab"
import Tabs from "@tabs"

const MetaComponents = ({ metaComponents, name, designerRef}) => {
  const [design, setDesign] = useState(false);
  const document = useDocument();

  const toggleDesign = (mode) => {
    setDesign(mode !== undefined ? mode : !design);
  }

  const handleEditElement = (element) => {
    //Set a component, necesary to get Metadata from the element
    document.handleSetEditElement(element);
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

  return (
    <DesignerContext.Provider 
      value={{ 
        designerMode: true, designerRef, design: document.mode === "designer", toggleDesign,
        handleEditElement, handleDeleteElement
      }}
    >
      <Tailwind/>
      <MetaComponent
        className="gap-4"
        elements={JSON.parse(metaComponents || "[]")}
        parent={designerRef}
        ref={(self) => {
          if (self) self.parentComponent = designerRef;
        }}
      />
    </DesignerContext.Provider>
  );
}

const DesignerButton = () => {
  const document = useDocument();
  return (
    <Button
      variant="secondary"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        document.handleChangeMode();
      }}
    >
      {document.mode === "designer" ? <EyeIcon className="mr-2" /> : <BrushIcon className="mr-2" />}
      {document.mode === "designer" ? "Preview" : "Design"}
    </Button>
  );
}

export default class Designer extends Component {
  isWritable = true;

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

  header() {
    return (
      <div className="flex w-full flex-row justify-between pt-2 px-2 pb-0">
        <div>
          <h1 className="text-xl">{this.data.label}</h1>
        </div>
        {this.props.fieldDesigner && <div className="space-x-1">
          <DesignerButton/>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              this.setState({ IAGenerator: true, IAOperation: true });
            }}
          >
            <StarIcon className="mr-2" />
            Design IA
          </Button>
          <Modal
            title="IA Generator via CHAT GPT-3.5"
            icon={<span className="fa fa-magic pr-2 text-success" />}
            size="md"
            open={this.state.IAGenerator}
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
              this.setState({ IAGenerator: false });
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
                  this.promptInput = ref.target.value;
                }}
                className="bg-transparent w-full h-50 border border-input rounded-md p-2"
              />
            </div>
          </Modal>
        </div>
        }
      </div>
    );
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
    const className = loopar.sidebarOption !== "preview" ? " element designer design true bg-red-100" : "";

    return (
      <div className="rounded-sm">
        {this.header()}
        <FormField
          name={data.name}
          //key={elementManage.getUniqueKey()}
          render={({ field }) => {
            return (
              <Tabs
                data={{ name: data.name + (this.props.fieldDesigner ? "_designer" : "_element")}}
                key={data.name + (this.props.fieldDesigner ? "_designer" : "_element")}
                asChild
              >
                <Tab
                  label={<div className="flex"><BrushIcon className="h-6 w-6 pr-2" /> Designer</div>}
                  name={data.name + "designer_tab"}
                  key={data.name + "designer_tab"}
                >
                  <div
                    className={"design design-area rounded-lg border bg-card/50 text-card-foreground shadow-sm w-full" + className}
                  >
                    <Droppable
                      className="p-5 space-y-4"
                      receiver={this}
                      isDesigner={this.props.fieldDesigner}
                      isDroppable={this.props.fieldDesigner}
                    >
                      <MetaComponents
                        name={data.name}
                        metaComponents={field.value}          
                        designerRef={this}             
                      />
                    </Droppable>
                  </div>
                </Tab>
                <Tab
                  label={<div className="flex"><Code2Icon className="h-6 w-6 pr-2" /> JSON</div>}
                  name={field.name + "model_tab"}
                  key={field.name + "model_tab"}
                >
                  <div className="text-success-500 max-h-[720px] overflow-x-auto whitespace-pre-wrap rounded-lg border p-2 font-mono text-sm font-bold text-green-600">
                    {JSON.stringify(JSON.parse(field.value || "[]"), null, 2)}
                  </div>
                </Tab>
              </Tabs>
            )
          }}
        />
      </div>
    );
  }

  componentDidMount() {
    super.componentDidMount();
    if (this.props.fieldDesigner) {
      loopar.Designer = this;
    } else {
      return;
    }

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

    const lastParentKey = current ? current.parentComponent.data.key : null;
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

  get #elements() {
    return JSON.parse(this.context.getValues(this.props.data.name) || "[]");
  }

  makeElements(elements, callback) {
    const data = this.data;
    data.value = JSON.stringify(elementManage.fixElements(elements));

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
        console.log(["On duplicate field", {exist, data,key}])
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
          /*el.data.background_image = JSON.stringify(
            fileManager.getMappedFiles(el.data.background_image)
          );*/

          //el.data.background_image = fileManager.getMappedFiles(el.data.background_image);
          //console.log(["updateElement", el.data.background_image])
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
