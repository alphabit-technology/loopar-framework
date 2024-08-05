import Component from "@component";
import { Droppable } from "$droppable";

export default function Tab({data, ...props}) {
  return (
    <Droppable
      {...props}
      receiver={this}
    />
  )
}
