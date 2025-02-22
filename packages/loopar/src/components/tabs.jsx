import ComponentDefaults from "./base/component-defaults";
import elementManage from "@tools/element-manage";
import { Tabs as BaseTabs, TabsContent, TabsList, TabsTrigger } from "@cn/components/ui/tabs";
import { useDesigner } from "@context/@/designer-context";
import MetaComponent from "@meta-component";
import React, { useEffect } from "react";
import {useCookies} from "@services/cookie";

const TabContent = ({element, parent}) => {
  if(element.type === "dynamic.component"){
    return (
      <MetaComponent
        elements={[
          {
            element: "tab",
            //...element,
            data: element.data,
            elements: element.elements,
          },
        ]}
        parent={parent}
      />
    )
  }

  return <>{element.content}</>
}

function TabFn({id, elementsDict, asChild = false, setElements, parent}){
  const {designerMode} = useDesigner();
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
    if((!checkIfTabExists(currentTab))){7
      selectFirstTab();
    }else{
      elementsDict.length === 0 && !asChild && designerMode && addTab();
    }
  }, [designerMode, id, currentTab, elementsDict]);

  useEffect(() => {
    !checkIfTabExists(currentTab) && selectFirstTab();
  }, []);

  return (
    <BaseTabs 
      //defaultValue={currentTab}
      value={currentTab}
      className="w-full"
    >
      <TabsList className="inline-table align-middle">
        {
          elementsDict.map(({data}) => (
            <TabsTrigger
              value={getKey(data)}
              onMouseDown={(e) => {
                setCurrentTab(getKey(data));
              }}
            >{data.label}</TabsTrigger>
          ))
        }
        {(designerMode && !asChild)? (
          <TabsTrigger
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addTab(getIdentifier(id));
            }}
            className="bg-red-500 mx-2 text-primary"
          >
            +
          </TabsTrigger>
        ) : null}
      </TabsList>
      {
        elementsDict.map((element) => {
          return (
            <TabsContent
              value={getKey(element.data)}
            >
              <TabContent element={element} parent={parent}/>
            </TabsContent>
          )
        })
      }
    </BaseTabs>
  )
}

export default function MetaTabs(props){
  const {data, setElements} = ComponentDefaults(props);
  
  const elementsDict=()=>{
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
  }

  return (
    <div className="p-2 my-3 border border-separate" id={data.id}>
      {data.label && <h4 className="p-2">{data.label}</h4>}
      <TabFn
        id={data.id || data.name}
        data={data}
        elementsDict={elementsDict()}
        asChild={props.asChild}
        setElements={(elements, callback) => {
          setElements(elements, callback);
        }}
      />
    </div>
  )
}

MetaTabs.requires = ["tab"]