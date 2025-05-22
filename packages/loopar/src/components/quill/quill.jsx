import { useRef } from 'react';
import Editor from './editor';
import 'quill/dist/quill.snow.css';
import './quill.css';
import './editor.css';

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote"],

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

  ['image', 'code-block'], // custom dropdown

  ["clean"], // remove formatting button
];

export default function QuillR (props){
  const quillRef = useRef();

  return (
    <div>
      <Editor
        ref={quillRef}
        toolbarOptions={toolbarOptions}
        defaultValue={props.value}
        onTextChange={(content, delta, source) => {
          if (source === 'user') {
            props.onChange(quillRef.current.getContents());
          }
        }}
      />
    </div>
  );
};