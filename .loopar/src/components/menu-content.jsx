import Component from "$component";
import elementManage from "$tools/element-manage";
import MetaComponent from "@meta-component";
import { useDesigner } from "@custom-hooks";

function MenuContent({ menuElements, contentElements, menuRef }) {
  const isDesigner = useDesigner().designerMode;

  return (
    <div className={`relative w-full flex flex-row ${!isDesigner && "pt-webHeaderHeight"} h-full`}>
      <div className={`w-full h-full py-2 px-5 ${!isDesigner ? 'xl:pr-[250px]' : 'w-0'}`}>
        <MetaComponent
          elements={[
            {
              element: "div",
              data: contentElements.data,
              elements: contentElements.elements,
            },
          ]}
          parent={menuRef}
        />
      </div>
      <div
        className={`${isDesigner ? 'sticky w-[250px]' : 'fixed w-0 xl:w-[250px]'} right-0 z-1 top-webHeaderHeight h-full overflow-y-auto overflow-x-hidden transition-all duration-600 ease-in-out`}
      >
        <div className="flex flex-col gap-2 p-2 w-full">
          <MetaComponent
            elements={[
              {
                element: "fragment",
                data: menuElements.data,
                elements: menuElements.elements,
              },
            ]}
            parent={menuRef}
          />
        </div>
      </div>
    </div>
  )
}

export default class MenuContentClass extends Component {
  componentDidMount() {
    const names1 = elementManage.elementName(this.props.element);
    const names2 = elementManage.elementName(this.props.element);

    if (this.elementsDict.length === 0) {
      const baseStructure = [
        {
          element: "fragment",
          data: {
            name: names1.name,
            label: names1.label,
            key: names1.id,
          },
        },
        {
          element: "fragment",
          data: {
            name: names2.name,
            label: names2.label,
            key: names2.id,
          },
        },
      ]

      this.setElements(baseStructure);
    }
  }

  get elementsDict() {
    const elements = this.props.children || this.props.elements || [];

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

  render() {
    const elementsDict = this.elementsDict;
    const menuElements = elementsDict[0];
    const contentElements = elementsDict[1];

    if (elementsDict.length === 0) {
      return <></>
    }

    return (
      <MenuContent
        menuElements={menuElements}
        contentElements={contentElements}
        menuRef={this}
      />
    );
  }
}