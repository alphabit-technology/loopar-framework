'use client';

import Component from "$component";
import { DesignerContext, useDesigner } from "@custom-hooks";
import React, { useCallback, useMemo } from "react";
import {marked} from "marked";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import "./markdown.css"

function MarkdownEditor({ data, handleChange, ...props }) {
  const {design} = useDesigner();

  if(!design){
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

export default class MarkdownBase extends Component {
  isWritable = false;
  static contextType = DesignerContext;

  constructor(props = {}) {
    super(props);

    this.state = {
      ...this.state,
      parsedData: null,
      mounted: false,
    };
  }

  render() {
    const data = this.data;
    const handleChange = (value) => {
      data.value !== value && this.set("value", value);
    }
    
    return (
      <MarkdownEditor data={data} handleChange={handleChange} id={data.id}/>
    )
  }

  get metaFields() {
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
  }
}
