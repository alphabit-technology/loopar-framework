'use client';

import ComponentDefaults from "$component-defaults";
import { useDesigner } from "@context/@/designer-context";
import React, { useCallback, useMemo } from "react";
import {marked} from "marked";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import "./markdown.css"

export default function MetaMarkdown (props) {
  const { set, data } = ComponentDefaults(props);
  const {designing} = useDesigner();

  const handleChange = (value) => {
    data.value !== value && set("value", value);
  }
  
  if(!designing){
    return (
      <div className="contents w-full prose dark:prose-invert">
        <div id={props.id} dangerouslySetInnerHTML={{__html: marked.parse(data.value || "")}}/>
      </div>
    )
  }

  const onChange = useCallback((value) => {
    handleChange(value);
  }, []);

  const autofocusNoSpellcheckerOptions = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
    };
  }, []);

  return (
    <div className="contents w-full prose dark:prose-invert">
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

MetaMarkdown.metaFields = () => {
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
};
