import Component from "$component";
import elementManage from "$tools/element-manage";
import { Tabs as BaseTabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDesigner } from "@custom-hooks";
import MetaComponent from "@meta-component";
import { PlusIcon } from "lucide-react";
import React, { useEffect} from "react";
import {useCookies} from "@services/cookie";


function TabFn({id, elementsDict, asChild = false, setElements}){
  const designer = useDesigner();
  const getIdentifier = () => {
    return `${id}${designer.designerMode ? '-designer' : ''}`;
  }
  
  const [currentTab, setCurrentTab] = useCookies(getIdentifier(), elementsDict[0]?.data?.key);

  const selectFirstTab = () => {
    elementsDict.length > 0 &&  setCurrentTab(elementsDict[0].data.key);
  }

  const checkIfTabExists = (key) => {
    return elementsDict.some((element) => element.data.key === key);
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
    if(!currentTab || currentTab === "undefined" || !checkIfTabExists(currentTab)){ 
      selectFirstTab();
      return;
    }

    elementsDict.length === 0 && !asChild && designer.designerMode && addTab();
  }, [currentTab, elementsDict]);

  const getTabContent = (element) => {
    if(element.type === "dynamic.component"){
      return (
        <MetaComponent
          elements={[
            {
              element: "tab",
              data: element.data,
              elements: element.elements,
            },
          ]}
          parent={this}
        />
      )
    }

    return element.content;
  }

  return (
    <BaseTabs defaultValue={currentTab} className="w-full" key={id + elementsDict.length + currentTab} >
      <TabsList className="inline-table align-middle">
        {
          elementsDict.map(({data}) => (
            <TabsTrigger
              value={data.key}
              onClick={() => {
                setCurrentTab(data.key);
              }}
            >{data.label}</TabsTrigger>
          ))
        }
        {(designer.designerMode && !asChild)? (
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
              value={element.data.key}
            >
              {getTabContent(element)}
            </TabsContent>
          )
        })
      }
    </BaseTabs>
  )
}

export default class Tabs extends Component {
  get requires(){
    return {
      modules: ["tab"],
    }
  }

  get elementsDict () {
    const elements = this.props.children || this.props.elements || [];

    return elements.map((element) => {
      if (element.$$typeof === Symbol.for("react.element")) {
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

  render() {
    const props = this.props;

    return (
      <div className="p-2 my-3 border border-separate" id={props.data?.id}>
        {props.data.label && <h4 className="p-2">{props.data.label}</h4>}
        <TabFn
          id={super.identifier}
          elementsDict={this.elementsDict}
          asChild={props.asChild}
          setElements={(elements, callback) => {
            this.setElements(elements, callback);
          }}
        />
      </div>
    )
  }
}