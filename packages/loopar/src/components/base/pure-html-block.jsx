import {cn} from "@/lib/utils";
import { useEffect } from 'react';

export function Markdown({ className, content }) {
  const markup = { __html: content };

  useEffect(() => {
    const handleCopyClick = async (event) => {
      const copyButton = event.target.closest("[data-code]");
     if (copyButton) {
      const code = copyButton.getAttribute("data-code");
      const originalHTML = copyButton.innerHTML;
      try {
        await navigator.clipboard.writeText(code);
        copyButton.innerHTML = "Copied! ✅";
        setTimeout(() => (copyButton.innerHTML = originalHTML), 2000);
      } catch (err) {
        console.error("❌ Error on copy code:", err);
        copyButton.innerHTML = "Error ⚠️";
      }
    }
    };

    document.addEventListener("click", handleCopyClick);

    return () => {
      document.removeEventListener("click", handleCopyClick);
    };
  }, []);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={markup}
    />
  )
}


export default function PureHTMLBlock({ element, className = "", data, ...props }) {
  if (element.element == MARKDOWN) {
    return (
      <div
        className="contents w-full prose dark:prose-invert"
        {...props}
      >
        <div className={cn(className, "pb-10")} id={data.id}>
          <Markdown content={data.value} />
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