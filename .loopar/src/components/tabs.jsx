import ComponentDefaults from "./base/component-defaults";
import elementManage from "$tools/element-manage";
import { Tabs as BaseTabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDesigner } from "@context/@/designer-context";
import MetaComponent from "@meta-component";
import { PlusIcon } from "lucide-react";
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
  const getIdentifier = () => {
    return `${id}${designerMode ? '-designer' : ''}`;
  }

  const getKey = (data = {}) => {
    return data.key + (designerMode ? '-designer' : '');
  }
  
  const [currentTab, setCurrentTab] = useCookies(getIdentifier(), getKey(elementsDict[0]?.data));

  const selectFirstTab = () => {
    elementsDict.length > 0 &&  setCurrentTab(getKey(elementsDict[0]?.data));
  }

  const checkIfTabExists = (key) => {
    return elementsDict.some((element) => getKey(element.data) === key);
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
    if((!currentTab || currentTab === "undefined" || !checkIfTabExists(currentTab)) && !designerMode){
      selectFirstTab();
      return;
    }

    elementsDict.length === 0 && !asChild && designerMode && addTab();
  }, [currentTab, elementsDict]);

  return (
    <BaseTabs 
      defaultValue={currentTab} 
      className="w-full"
      key={id + elementsDict.length + currentTab}
    >
      <TabsList className="inline-table align-middle">
        {
          elementsDict.map(({data}) => (
            <TabsTrigger
              key={getKey(data)}
              value={getKey(data)}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();

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
              addTab(getIdentifier());
            }}
          >
            <PlusIcon className="pr-1"/>
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
      if (element.$$typeof === Symbol.for("react.element") || element.$$typeof === Symbol.for("react.fragment")) {
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
          id={data.key}
          elementsDict={elementsDict()}
          asChild={props.asChild}
          setElements={(elements, callback) => {
            setElements(elements, callback);
          }}
          parent={this}
        />
      </div>
    )
}

MetaTabs.requires = ["tab"]