'use client';

import loopar from "$loopar";
import Component from "$component";
import { DesignerContext, useDesigner } from "@custom-hooks";
import React, { useCallback, useEffect, useMemo, useRef, useState} from "react";
import {marked} from "marked";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import "./markdown.css"

function MarkdownEditor({ data, handleChange, ...props }) {
  const {design} = useDesigner();

  if(!design){
    return (
      <div dangerouslySetInnerHTML={{__html: marked.parse(data.value || "")}} />
    )
  }

  const onChange = useCallback((value) => {
    handleChange(value);
  }, []);

  const autofocusNoSpellcheckerOptions = useMemo(() => {
    return {
      autofocus: true,
      spellChecker: false,
    };
  }, []);

  return (
    <SimpleMDE
      options={autofocusNoSpellcheckerOptions}
      value={data.value}  
      onChange={onChange}
    />
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
      <MarkdownEditor data={data} handleChange={handleChange}/>
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
