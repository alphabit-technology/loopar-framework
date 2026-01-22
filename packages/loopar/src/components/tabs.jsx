import { ComponentDefaults } from "./base/ComponentDefaults";
import elementManage from "@@tools/element-manage";
import { Tabs as BaseTabs, TabsContent, TabsList, TabsTrigger } from "@cn/components/ui/tabs";
import { useDesigner } from "@context/@/designer-context";
import { useEffect, useMemo } from "react";
import {useCookies} from "@services/cookie";
import { Droppable } from "@droppable";
import { Trash2Icon, PlusIcon } from "lucide-react";
import {Button} from "@cn/components/ui/button";

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
  const {id, elementsDict, asChild = false, canCustomize, setElements, parent} = props;
  
  const {designerMode, isDesigner, handleEditElement, handleDeleteElement} = useDesigner();
  const getIdentifier = (id) => `${id}${designerMode ? '-designer' : ''}`;
  const getKey = (data = {}) => getIdentifier(data.key || data.name);
  
  const [currentTab, setCurrentTab] = useCookies(getIdentifier(id), getKey(elementsDict[0]?.data));

  const selectFirstTab = () => {
    elementsDict.length > 0 && setCurrentTab(getKey(elementsDict[0]?.data));
  }

  const checkIfTabExists = (key) => {
    return elementsDict.some(element => getKey(element.data) === key);
  }

  const addTab = () => {
    const [name, label] = [`tab_${elementManage.uuid()}`, `Tab ${elementsDict.length + 1}`];

    const tab = [
      {
        element: "tab",
        key: name,
        data: {
          name,
          id: name,
          label,
          droppable: true,
          draggable: false,
          key: name,
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
        <TabsList className="inline-flex items-center gap-3 no-drag bg-transparent">
          {elementsDict.map(({data = {}}) => (
            <TabsTrigger
              key={getKey(data)}
              value={getKey(data)}
              className="flex items-center gap-2 !px-4 !min-h-[44px]"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentTab(getKey(data));
                if (designerMode) {
                  handleEditElement(data.key);
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
                    handleDeleteElement(data.key);
                  }}
                />
              )}
            </TabsTrigger>
          ))}
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
      
      {elementsDict.map((element, index) => (
        <TabsContent key={getKey(element.data)} value={getKey(element.data)}>
          <TabContent element={element} parent={parent + index}/>
        </TabsContent>
      ))}
    </BaseTabs>
  )
}

export default function MetaTabs(props){
  const {data, setElements} = ComponentDefaults(props);
  
  const elementsDict=useMemo(()=>{
    const elements = props.children || props.elements || [];

    return elements.map((element) => {
      if (element.$$typeof === Symbol.for("react.element") || element.$$typeof === Symbol.for("react.fragment") || element.$$typeof === Symbol.for("react.transitional.element")) {
        return {
          element: "tab",
          type: "react.element",
          key: element.key,
          data: {
            name: element.props.name,
            label: element.props.label,
            key: element.key,
          },
          content: element.props.children,
        };
      } else {
        return {
          element: "tab",
          type: "dynamic.component",
          key: element.key,
          data: element.data,
          elements: element.elements,
        };
      }
    });
  }, [props.children, props.elements, props.data]);

  const parentKey = data.key || data.id || data.name;

  return (
    <div className="p-2 my-3 border border-separate" id={data.id}>
      {data.label && <h4 className="p-2">{data.label}</h4>}
      <TabFn
        id={data.id || data.name || data.key}
        data={data}
        elementsDict={elementsDict}
        asChild={props.asChild}
        setElements={setElements}
        canCustomize={props.canCustomize}
        parent={parentKey}
      />
    </div>
  )
}

MetaTabs.requires = ["tab"]