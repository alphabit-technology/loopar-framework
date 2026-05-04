import { useDesigner } from "@context/@/designer-context";
import MarkdownPreview from '@uiw/react-markdown-preview';

export default function SEO(props){
  const { designing } = useDesigner();

  const { data={} } = props;

  const options = (data.options || "").split("\n").filter(i => i.length > 0 && i.includes("=")).map((item) => {
    const [key, value] = item.split("=");
    return {[key]: value};
  });

  const metaName = data.meta_name || "meta";

  if(designing){
    const attrs = options.map(meta => Object.keys(meta).map(key => `${key}="${meta[key]}"`)).join(" ");
    
    const source = `\`\`\`jsx\n<${metaName} ${attrs}/>\n\`\`\``;
    return (
      <MarkdownPreview source={source} />
    )
  }
}
SEO.dontHaveMetaElements = ["name"];
SEO.metaFields = () => {
  return [[
    {
      group: "form",
      elements: {
        meta_name: {
          element: "input",
          data: {
            label: "Name",
            description: "name of the meta tag"
          }
        },
        options: {
          element: "textarea",
          data: {
            label: "Options",
            description: "key=value pairs separated by new line"
          }
        }
      }
    },
  ]]
}