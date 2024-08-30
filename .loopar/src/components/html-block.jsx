import ComponentDefaults from "@component-defaults";
import {Quill} from '@quill';
import { useDesigner } from "@context/@/designer-context";

export default function MetaHtmlBlock(props) {
  const { data } = ComponentDefaults(props);
  const {designerRef, designing} = useDesigner();

  const handleChange = (content) => {
    designerRef && designerRef.updateElement(data.key, {value: content});
  }

  if(!designing){
    return (
      <div className="contents w-full prose dark:prose-invert">
        <div id={props.id} dangerouslySetInnerHTML={{__html: data.value || ""}}/>
      </div>
    )
  }

  return <Quill data={data} onChange={handleChange} />
}
