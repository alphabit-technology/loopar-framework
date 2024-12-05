


export default function PureHTMLBlock({ element, className = "", data, ...props }) {
  if(element.element == MARKDOWN){
    return (
      <div
        className={`h-auto w-full prose dark:prose-invert pb-8`}
        id={element.data.id}
        dangerouslySetInnerHTML={{ __html: element.data.value }}
        {...props}
      />
    )
  }else{
    return (
      <div className="ql-container ql-snow" style={{border: "none"}}>
        <div 
          className="ql-editor"
          id={props.id} 
          dangerouslySetInnerHTML={{__html: data.value || ""}}
        />
      </div>
    )
  }
}