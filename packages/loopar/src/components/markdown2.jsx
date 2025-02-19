'use client';

import ComponentDefaults from "@component-defaults";
import { useDesigner } from "@context/@/designer-context";
import React, { useCallback, useMemo} from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import "./markdown/markdown.css"
import {loopar} from "loopar";

export default function MetaMarkdown (props) {
  const { set, data } = ComponentDefaults(props);
  const { designing } = useDesigner();
  const [active, setActive] = React.useState(false);

  const onChange = useCallback((value) => {
    handleChange(value);
  }, []);

  const autofocusNoSpellcheckerOptions = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
      toolbar: [
        "bold", "italic", "heading", "|", "quote", "code", "table", "horizontal-rule", "|", "link", "image", "side-by-side", "fullscreen", "|", "guide"
      ]
    };
  }, []);

  const handleChange = (value) => {
    data.value !== value && set("value", value);
  }
  
  if (!designing || !active) {
    const markup = {
      __html: loopar.utils.parseMarkdown(data.value || "")
    }
    return (
      <div
        className="contents w-full prose dark:prose-invert pb-10"
        onMouseEnter={() => setActive(true)}
      >
        <div id={props.id} dangerouslySetInnerHTML={markup}/>
      </div>
    )
  }

  return (
    <div
      className="contents w-full prose dark:prose-invert"
    >
      <div id={props.id}>
        <SimpleMDE
          options={autofocusNoSpellcheckerOptions}
          value={data.value}  
          onChange={onChange}
        />
      </div>
    </div>
  );
}

/*MetaMarkdown.metaFields = () => {
  return [
    {
      group: "custom",
      elements: {
        has_inside_data: {
          element: SWITCH,
          data: {
            description:
              "If you need to use data inside the markdown, check this option and use the variable {{ data }} inside the markdown.",
          },
        },
        ref_data: {
          element: TEXTAREA,
          data: {
            description:
              "Define name of the variable to be used inside the markdown, this variable will be taked from the data of the document",
          },
        },
      },
    },
  ];
};*/

/*
import ComponentDefaults from "@component-defaults";
import { useDesigner } from "@context/@/designer-context";
import React, { useCallback, useState} from "react";
import MarkdownPreview from '@uiw/react-markdown-preview';
import MarkdownEditor from "@uiw/react-markdown-editor";

import { cn } from "@/lib/utils";
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
          javascript({ jsx: true }),
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

  return (
    <Editor value={data.value} onChange={onChange} />
  )
}*/