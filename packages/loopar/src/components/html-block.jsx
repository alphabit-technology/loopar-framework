import Quill from './quill/quill';
import { useDesigner } from "@context/@/designer-context";

export default function MetaHtmlBlock(props) {
  const data = props.data || {};
  const {designerRef} = useDesigner();

  const handleChange = (content) => {
    designerRef && designerRef.updateElement(data.key, {value: content});
  }

  return <Quill data={data} onChange={handleChange}/>
}
