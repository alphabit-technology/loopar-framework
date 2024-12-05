import ComponentDefaults from "@component-defaults";
import {Quill} from './quill/quill';
import { useDesigner } from "@context/@/designer-context";

export default function MetaHtmlBlock(props) {
  const { data } = ComponentDefaults(props);
  const {designerRef} = useDesigner();

  const handleChange = (content) => {
    designerRef && designerRef.updateElement(data.key, {value: content});
  }

  return <Quill data={data} onChange={handleChange}/>
}
