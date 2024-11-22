import {Button} from "@/components/ui/button";
import {useDocument} from "@context/@/document-context";
import loopar from "loopar";

const buttons = {
  primary: "primary",
  secondary: "secondary",
  default: "default",
  ghost: "ghost",
  destructive: "destructive",
};

export default function MetaButton(props){
  const data = props.data;
  const {docRef} = useDocument();

  const handleClick = (e) => {
    e.preventDefault();
    
    if (data.action && docRef) {
      if(!docRef[data.action]) loopar.throw("Action not Defined",`Action ${data.action} not found in model`)
      docRef[data.action]();
    }
  }

  const getVariant = () => {
    return buttons[data.variant] || buttons.default;
  }

  return (
    <Button
      {...loopar.utils.renderizableProps(props)}
      variant={getVariant()}
      onClick={handleClick}
      className={props.className}
    >
      {data.label || "Button"}
    </Button>
  );
}

MetaButton.metaFields =()=>{
  return {
    group: "form",
    elements: {
      action: {
        element: INPUT,
        data: {
          description:
            "You can define action like save, print..., button will be call action function in your model",
        },
      },
      variant: {
        element: SELECT,
        data: {
          options: Object.keys(buttons).map((button) => {
            return {
              option: button,
              value: buttons[button],
            };
          }),
        },
      },
    },
  };
}