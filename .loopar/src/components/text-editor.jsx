import BaseInput from "$base-input";
import { useState } from "react";

import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function TextEditor({onChange}) {
  const [value, setValue] = useState('');

  const toolbarOptions = [
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block"],

    [{ header: 1 }, { header: 2 }], // custom button values
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }], // superscript/subscript
    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    [{ direction: "rtl" }], // text direction

    [{ size: ["small", false, "large", "huge"] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ font: [] }],
    [{ align: [] }],

    ["clean"], // remove formatting button
  ];
  const handleChange = (content, delta, source, editor) => {
    setValue(content);
    onChange(content);
  }
  return (
    <ReactQuill
      theme="snow" 
      value={value} 
      onChange={handleChange}
      modules={{
        toolbar: toolbarOptions
      }}
    />
  )
}

export default class TextEditorClass extends BaseInput {
  constructor(props) {
    super(props);
  }

  render() {
    return this.renderInput(field => {
      
      return (
      <>
      <style>{`
.ql-editor {
  min-height: 300px;
}
.quill > * {
  border-color: inherit !important;
  color: inherit !important;
}
.quill > .ql-toolbar {
  /* border radius of the toolbar */
  border-radius: 10px 10px 0 0;
}
.quill > .ql-container {
  /* border radius of the container and for font size*/
  font-size: inherit;
  border-radius: 0 0 10px 10px;
}
.ql-toolbar.ql-snow .ql-picker-label {
  color: inherit !important;
  opacity: 0.76;
}
.ql-snow .ql-picker {
  color: inherit !important;
}
.quill > .ql-container > .ql-editor.ql-blank::before {
  /* for placeholder */
  color: inherit;
}
.ql-snow.ql-toolbar button svg {
  opacity: 0.76;
  color: currentColor;
}
.ql-snow .ql-stroke {
  /* for the border of the editor */
  stroke: currentColor !important;
}
.ql-snow .ql-fill {
  /* for the bg color */
  fill: currentColor !important;
}
.ql-picker-item {
  /* for dropdown */
  color: #444 !important;
}
      `}
      </style>
        <TextEditor onChange={field.onChange}/>
      </>
    )
  });
  }

  val(val = null) {
    if (val != null) {
      this.editor.setContents(JSON.parse(val || "{}"));
      this.trigger("change");
    } else {
      return JSON.stringify(this.editor.getContents());
    }
  }
}
