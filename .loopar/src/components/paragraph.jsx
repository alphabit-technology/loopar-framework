import BaseText from "$base-text";
import { useDesigner} from "@custom-hooks";


export function Paragraph(props) {
  const designer = useDesigner();
  const style = {
    ...props.style,
    ...(designer.design ? {maxHeight: "6em", overflow: "auto", display: "-webkit-box", "-webkit-box-orient": "vertical"} : {})
  }

  return (
    <div className="text-pretty mt-6 text-slate-700 dark:text-slate-300">
      <p className="mb-4 text-lg" style={style}>{props.text}</p>
    </div>
  )
}

export default class ParagraphClass extends BaseText {
  droppable = false;
  draggable = true;
  tagName = "p";

  render() {
    let pStyle = {};
    if (this.props.designer) {
      this.tagName = "div";

      this.style = {
        ...this.style,
        //width: "200px",
        maxHeight: "6em",
        overflow: "auto",
        display: "-webkit-box",
        "-webkit-box-orient": "vertical",
      };
      /*
            .paragraph-container {
            width: 200px; 
            height: 3em; 
            overflow: hidden;
            display: -webkit - box;
            - webkit - box - orient: vertical;
      }*/

      pStyle = {
        display: "-webkit-box",
        "- webkit-line-clamp": 5,
        "-webkit-box -orient": "vertical",
        overflow: "hidden",
      };
    }

    return (
      <Paragraph text={this.getText()}/>
    )

    return (
      <blockquote className="text-pretty mt-6 text-slate-700 dark:text-slate-300">
        <p className="mb-4 text-lg " style={pStyle}>{this.getText()}</p>
      </blockquote>
    )
    return super.render(
      <p
        className={`text-muted font-size-lg mb-4 ${this.getAlign()}`}
        style={pStyle}
      >
        {this.getText()}
      </p>
    );
  }
}
