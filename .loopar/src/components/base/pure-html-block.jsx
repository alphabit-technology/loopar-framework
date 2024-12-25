import {cn} from "@/lib/utils";
import MarkdownPreview from '@uiw/react-markdown-preview';

export default function PureHTMLBlock({ element, className = "", data, ...props }) {

  if (element.element == MARKDOWN) {
    return (
      <div
        className="contents w-full prose dark:prose-invert"
        {...props}
      >
        <div className={cn(className, "pb-10")} id={props.id}>
          <MarkdownPreview source={data.value} />
        </div>
      </div>
    )
  } else {
    const markup = { __html: data.value };
    return (
      <div className="ql-container ql-snow" style={{border: "none"}}>
        <div 
          className="ql-editor"
          id={props.id} 
          dangerouslySetInnerHTML={markup}
        />
      </div>
    )
  }
}