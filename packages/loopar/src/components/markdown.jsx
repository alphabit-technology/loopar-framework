import ComponentDefaults from "@component-defaults";
import { useDesigner } from "@context/@/designer-context";
import React, { useCallback, useState, useMemo} from "react";
import MarkdownPreview from '@uiw/react-markdown-preview';
import MarkdownEditor from "@uiw/react-markdown-editor";
import { EditorView } from '@codemirror/view'
import "easymde/dist/easymde.min.css";
import "./markdown/markdown.css"

import SimpleMDE from "react-simplemde-editor";

import { cn } from "@cn/lib/utils";
import { useWorkspace } from "@workspace/workspace-provider";

export function Preview({ source }) {
  return (
    <div
      className="contents w-full prose dark:prose-invert"
    >
      <div className={cn("pb-10")}>
        <MarkdownPreview source={source} />
      </div>
    </div>
  )
}

export function Editor({ value, onChange }) {
  const [markdownVal, setMarkdownVal] = useState(value);
  const { theme } = useWorkspace();

  return (
    <div data-color-mode={theme}>
      <MarkdownEditor
        value={markdownVal}
        onChange={(value) => {
          setMarkdownVal(value);
        }}
        extensions={[
          EditorView.lineWrapping
        ]}
      />
    </div>
  )
}

export default function MetaMarkdown (props) {
  const { set, data } = ComponentDefaults(props);
  const {designing} = useDesigner();

  const handleChange = (value) => {
    data.value !== value && set("value", value);
  }
  
  if (!designing) {
    return <Preview source={data.value} />
  }

  const onChange = useCallback((value) => {
    handleChange(value);
  }, []);

  const options = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
      toolbar: [
        "bold", "italic", "heading", "|", "quote", "code", "table", "horizontal-rule", "|", "link", "image", "side-by-side", "fullscreen", "|", "guide"
      ]
    };
  }, []);
  
  return (
    <div
      className="contents w-full prose dark:prose-invert"
    >
      <div id={props.id} className="mt-4" onPointerDown={(e) => {
        e.stopPropagation();
      }}>
        <SimpleMDE
          options={options}
          value={data.value}  
          onChange={onChange}
        />
      </div>
    </div>
  );
}