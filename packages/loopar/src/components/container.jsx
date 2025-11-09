import { Droppable } from "@droppable";
import { useDesigner } from "@context/@/designer-context";

export default function Container(props){
  const { designerMode, designerModeType } = useDesigner();
  const newProps = {...props};
  delete newProps.style;

  return (
    <div   
      {...props}
      className={!designerMode || designerModeType == "preview" ? "min-h-page bg-cover bg-center bg-fixed" : ""}
    >
      <Droppable {...newProps}/>
    </div>
  );
}