import MetaComponent from "@meta-component";
import { useDesigner } from "@context/@/designer-context";
import { useEffect } from "react";
import { Link } from "@link"
import { useState } from "react";
import { Droppable } from "./droppable/droppable";

const Section = ({ element }) => {
  return (
    <section
      id={element.data.label || element.data.id || element.data.key}
    >
      <MetaComponent
        key={element.data.key}
        elements={[element]}
      />
    </section>
  );
}

export default function MenuContentMeta(props) {
  const isDesigner = useDesigner().designerMode;
  const [elements, setElements] = useState(props.elements || []);

  useEffect(() => {
    isDesigner && setElements(props.elements || []);
  }, [props.elements, isDesigner]);

  return (
    <div className={`relative w-full flex flex-row ${!isDesigner && ""} h-full`}>
      <div className={`w-full h-full py-2 px-5 ${!isDesigner ? 'xl:pr-[250px]' : 'w-0'}`}>
        {isDesigner ? <Droppable {...props}/> : 
          <>
            {elements.map((element) => (
              <Section element={element} key={element.data.key} />
            ))}
          </>
        }
      </div>
      <div
        className={`${isDesigner ? 'sticky w-[250px]' : 'fixed w-0 xl:w-[250px]'} right-0 z-1 top-web-HeaderHeight h-full overflow-y-auto overflow-x-hidden transition-all duration-600 ease-in-out`}
      >
        {!isDesigner && <h6 className="px-2 pt-2">ON THIS PAGE</h6>}
        <div className="flex flex-col gap-2 p-2 w-full">
          {elements.map((element) => (
            <Link
              key={element.data.key + "-menu"}
              to={`#${element.data.label || element.data.id  || element.data.key}`}
            >
              {element.data.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}