import Preassembled from "$preassembled";
import { Droppable } from "$droppable";
import {cn} from "@/lib/utils";
import loopar from "$loopar";
import Image from "@image";

export default class Banner extends Preassembled {
  droppable = true;

  defaultElements = [
    {
      element: "title",
      data: {
        text: this.data?.label || "Banner Title...",
        size: "3xl",
        text_align: "center",
      },
    },
    {
      element: "subtitle",
      data: {
        text: this.data?.text || "Subtitle...",
        text_align: "center",
      },
    },
  ];

  get designerClasses() {
    return "h-full w-full p-3 py-6";
  }

  render() {
    const className = cn(this.props.className, "grid grid-cols-1 gap-4 place-content-center w-full h-full");
    
    return (
      <div
        {...loopar.utils.renderizableProps(this.props)}
        className={className}
      >
        <Droppable receiver={this}>
          {this.props.children}
          {this.elements}
        </Droppable>
      </div>
    );
  }
}
