import { ComponentDefaults } from "./base/ComponentDefaults";
import elementManage from "@@tools/element-manage";
import { Tabs as BaseTabs, TabsContent, TabsList, TabsTrigger } from "@cn/components/ui/tabs";
import { useDesigner } from "@context/@/designer-context";
import { useEffect, useMemo, useId } from "react";
import {usePersist} from "@services/persist-state";
import { Droppable } from "@droppable";
import { Trash2Icon, PlusIcon } from "lucide-react";
import {Button} from "@cn/components/ui/button";
import { getNodeKey } from "@global/prune-doc-structure";

const TabContent = ({element, parent, onDrop}) => {
  if(element.type === "dynamic.component"){
    return (
      <Droppable 
        {...element}
        key={null}
      />
    )
  }

  return <>{element.content}</>
}

function TabFn(props){
  const {id, elementsDict, node, data, asChild = false, canCustomize, setElements, parent} = props;

  const {designerMode, isDesigner, handleEditElement, handleDeleteElement} = useDesigner();
  const getIdentifier = (id) => `${id}${designerMode ? '-designer' : ''}`;
  const getKey = (tab = {}) => {
    const tabData = tab.data || {};
    const id = tab.node || tabData.key || tabData.id || tabData.name;
    return getIdentifier(id);
  };

  const [currentTab, setCurrentTab] = usePersist(getIdentifier(id), getKey(elementsDict[0]));

  const selectFirstTab = () => {
    elementsDict.length > 0 && setCurrentTab(getKey(elementsDict[0]));
  }

  const checkIfTabExists = (key) => {
    return elementsDict.some(element => getKey(element) === key);
  }

  const addTab = () => {
    const [name, label] = [`tab_${elementManage.uuid()}`, `Tab ${elementsDict.length + 1}`];

    const tab = [
      {
        element: "tab",
        node: name,
        data: {
          name,
          id: name,
          label,
          droppable: true,
          draggable: false
        },
      },
    ];

    setElements(tab, () => {
      setCurrentTab(name);
    });
  }

  useEffect(() => {
    if((!checkIfTabExists(currentTab))){
      selectFirstTab();
    }else{
      elementsDict.length === 0 && !asChild && designerMode && addTab();
    }
  }, [designerMode, id, currentTab, elementsDict]);

  useEffect(() => {
    !checkIfTabExists(currentTab) && selectFirstTab();
  }, []);

  const isCustomizable = useMemo(() => {
    return (typeof canCustomize == "undefined" ? true : canCustomize) && designerMode;
  }, [canCustomize, designerMode]);

  return (
    <BaseTabs 
      defaultValue={currentTab}
      value={currentTab}
      className="w-full"
    >
      <div className="flex items-center justify-between overflow-x-auto overflow-y-hidden">
        <TabsList className={`inline-flex items-center gap-1 no-drag bg-transparent ${props.tabsClassName || ""}`}>
          {elementsDict.map((tab) => {
            const data = tab.data || {};
            const tabKey = getKey(tab);
            const editKey = tab.node || data.key;
            return (
              <TabsTrigger
                key={tabKey}
                value={tabKey}
                className="flex items-center gap-2 !px-4 !min-h-[44px]"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentTab(tabKey);
                  if (designerMode && editKey) {
                    handleEditElement(editKey);
                  }
                }}
              >
                <span>{data.label}</span>
                {isCustomizable && (
                  <Trash2Icon
                    size={16}
                    className="text-red-500 hover:text-red-400 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editKey && handleDeleteElement(editKey);
                    }}
                  />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {isCustomizable && (
          <Button
            variant="default"
            size="icon"
            className="bg-primary !min-h-[44px] !min-w-[44px]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addTab(getIdentifier(id));
            }}
          >
            <PlusIcon size={16}/>
          </Button>
        )}
      </div>
      
      {elementsDict.map((element, index) => {
        const tabKey = getKey(element);
        return (
          <TabsContent key={tabKey} value={tabKey}>
            <TabContent element={element} parent={parent + index}/>
          </TabsContent>
        );
      })}
    </BaseTabs>
  )
}

export default function MetaTabs(props){
  const {data, node, setElements} = ComponentDefaults(props);
  const key = useId();
  
  const elementsDict=useMemo(()=>{
    const elements = props.children || props.elements || [];

    return elements.map((element, index) => {
      if (element.$$typeof === Symbol.for("react.element") || element.$$typeof === Symbol.for("react.fragment") || element.$$typeof === Symbol.for("react.transitional.element")) {
        return {
          element: "tab",
          type: "react.element",
          node: element.props?.name || `${key}-${index}`,
          data: {
            name: element.props.name,
            label: element.props.label,
          },
          content: element.props.children,
        };
      } else {
        return {
          element: "tab",
          type: "dynamic.component",
          node: getNodeKey(element),
          data: element.data,
          elements: element.elements,
        };
      }
    });
  }, [props.children, props.elements, props.data]);

  const parentKey = node || data.key || data.id || data.name;

  return (
    <div className={`p-2 my-3 pt-0 mt-0 border border-separate ${props.className} ${data.class}`}id={data.id}>
      {data.label && <h4 className="p-2">{data.label}</h4>}
      <TabFn
        id={data.id || data.name || data.key}
        data={data}
        elementsDict={elementsDict}
        asChild={props.asChild}
        setElements={setElements}
        canCustomize={props.canCustomize}
        parent={parentKey}
        tabsClassName={props.tabsClassName}
      />
    </div>
  )
}

MetaTabs.requires = ["tab"]