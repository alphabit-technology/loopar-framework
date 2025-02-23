import elementManage from "@@tools/element-manage";
import MetaComponent from "@meta-component";
import { useDesigner } from "@context/@/designer-context";
import {Button} from "@cn/components/ui/button";
import {useEffect} from "react";
import ComponentDefaults from "./base/component-defaults";
import { Link } from "@link"
import { useState } from "react";

const buildElementsDict = (props) => {
  const elements = props.elements || props.children || [];
  return elements.map((element) => {
    if (element.$$typeof === Symbol.for("react.transitional.element")) {
      return {
        element: "div",
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
        element: "div",
        type: "dynamic.component",
        key: element.key,
        data: element.data,
        elements: element.elements,
      };
    }
  });
}

export default function MenuContentMeta(props) {
  const isDesigner = useDesigner().designerMode;
  const { setElements } = ComponentDefaults(props);
  const [elementsDict, setElementsDict] = useState(buildElementsDict(props));

  const setStructure = () => {
    const elements = elementsDict;
    const [contentElements] = elements;

    if(!contentElements){
      const content = elementManage.elementName(props.element);

      setElements([{
        element: "fragment",
        data: {
          name: content.name,
          label: content.label,
          key: content.id,
        },
      }])
    }
  }

  useEffect(() => {
    isDesigner && setStructure();
  }, []);

  useEffect(() => {
    setElementsDict(buildElementsDict(props));
  }, [props.elements]);

  if (elementsDict.length === 0) {
    return (
      <div className="text-center text-red-500">
        <p>The default Menu structure has ben changed</p>
        <Button variant="destructive" onClick={e => { e.preventDefault(); setStructure() }}>Reset</Button>
      </div>
    );
  }

  return (
    <div className={`relative w-full flex flex-row ${!isDesigner && ""} h-full`}>
      <div className={`w-full h-full py-2 px-5 ${!isDesigner ? 'xl:pr-[250px]' : 'w-0'}`}>
        {isDesigner ?
          <MetaComponent
            elements={elementsDict}
          />
          : 
          (
            <>
              {elementsDict[0].elements.map((element) => (
                <div className="bg-red-500" id={element.data.label || element.data.id || element.data.key} key={element.data.key}>
                  <MetaComponent
                    key={element.data.key}
                    elements={[element]}
                  />
                </div>
              ))}
            </>
          )
        }
      </div>
      <div
        className={`${isDesigner ? 'sticky w-[250px]' : 'fixed w-0 xl:w-[250px]'} right-0 z-1 top-web-HeaderHeight h-full overflow-y-auto overflow-x-hidden transition-all duration-600 ease-in-out`}
      >
        {!isDesigner && <h6 className="px-2 pt-2">ON THIS PAGE</h6>}
        <div className="flex flex-col gap-2 p-2 w-full">
          {elementsDict[0].elements.map((element) => (
            <Link
              key={element.data.key + "-menu"}
              to={`#${element.data.label || element.data.id  || element.data.key}`}
              className="hover:underline"
            >
              {element.data.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}