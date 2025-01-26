import {cn} from "@/lib/utils";
import MarkdownPreview from '@uiw/react-markdown-preview';

const s = {
  1: "text-3xl font-bold",
  2: "text-2xl font-bold",
  3: "text-xl font-bold",
  4: "text-lg font-bold",
  5: "text-base font-bold",
  6: "text-sm font-bold",
}

const H = ({t, c}) => {
  const T = `h${t}`;
  return <T className={s[t]}>{c[1]}</T>
}

const customComponents = {
  h1: ({ node, ...props }) => <H t={1} c={props.children} />,
  h2: ({ node, ...props }) => <H t={2} c={props.children} />,
  h3: ({ node, ...props }) => <H t={3} c={props.children} />,
  h4: ({ node, ...props }) => <H t={4} c={props.children} />,
  h5: ({ node, ...props }) => <H t={5} c={props.children} />,
  h6: ({ node, ...props }) => <H t={6} c={props.children} />
};

export function Markdown({ className, children }) {
  return <MarkdownPreview className={className} source={children} components={customComponents}/>
}

export default function PureHTMLBlock({ element, className = "", data, ...props }) {
  if (element.element == MARKDOWN) {
    return (
      <div
        className="contents w-full prose dark:prose-invert"
        {...props}
      >
        <div className={cn(className, "pb-10")} id={data.id}>
          <Markdown>{data.value}</Markdown>
        </div>
      </div>
    )
  } else {
    const markup = { __html: data.value };
    return (
      <div className="ql-container ql-snow" style={{border: "none"}}>
        <div 
          className="ql-editor"
          id={data.id} 
          dangerouslySetInnerHTML={markup}
        />
      </div>
    )
  }
}