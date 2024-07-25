import { Droppable } from "@droppable";

export default function Div(props){
  return (
    <Droppable
      {...props}
    />
  );
}

Div.droppable = true;