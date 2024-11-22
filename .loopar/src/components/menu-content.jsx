import elementManage from "@tools/element-manage";
import MetaComponent from "@meta-component";
import { useDesigner } from "@context/@/designer-context";
import {Button} from "@/components/ui/button";
import {useEffect, useState} from "react";

export default function MenuContentMeta(props) {
  const isDesigner = useDesigner().designerMode;
  const [elements, setElements] = useState(props.children || props.elements || []);

  const getElementsDict = () => {
    return elements.map((element) => {
      if (element.$$typeof === Symbol.for("react.element")) {
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

  const setStructure = () => {
    const elements = getElementsDict();
    const [menuElements, contentElements] = elements;

    if(!menuElements){
      const menu = elementManage.elementName(props.element);

      elements.unshift({
        element: "fragment",
        data: {
          name: menu.name,
          label: menu.label,
          key: menu.id,
        },
      });
    }

    if(!contentElements){
      const content = elementManage.elementName(props.element);

      elements.push({
        element: "fragment",
        data: {
          name: content.name,
          label: content.label,
          key: content.id,
        },
      });
    }

    setElements(elements);
  }

  const elementsDict = getElementsDict();
  const [menuElements, contentElements] = elementsDict;

  useEffect(() => {
    isDesigner && setStructure();
  }, []);

  if (elementsDict.length === 0 || !menuElements || !contentElements) {
    return (
      <div className="text-center text-red-500">
        <p>The default Menu structure has ben changed</p>
        <Button variant="destructive" onClick={setStructure}>Reset</Button>
      </div>
    );
  }

  return (
    <div className={`relative w-full flex flex-row ${!isDesigner && ""} h-full`}>
      <div className={`w-full h-full py-2 px-5 ${!isDesigner ? 'xl:pr-[250px]' : 'w-0'}`}>
        <MetaComponent
          elements={[
            {
              element: "fragment",
              data: contentElements.data,
              elements: contentElements.elements,
            },
          ]}
        />
      </div>
      <div
        className={`${isDesigner ? 'sticky w-[250px]' : 'fixed w-0 xl:w-[250px]'} right-0 z-1 top-webHeaderHeight h-full overflow-y-auto overflow-x-hidden transition-all duration-600 ease-in-out`}
      >
        {!isDesigner && <h6 className="px-2 pt-2">ON THIS PAGE</h6>}
        <div className="flex flex-col gap-2 p-2 w-full">
          <MetaComponent
            key={menuElements.data.key}
            elements={[
              {
                element: "fragment",
                data: menuElements.data,
                elements: menuElements.elements,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}