import BaseInput from "$base-input";
import SimpleMDE from "react-simplemde-editor";
import React, {useMemo} from "react";
import {
  FormControl,
  FormDescription,
  FormLabel,
} from "@/components/ui/form";

import "easymde/dist/easymde.min.css";
import "./markdown.css"

export default function MarkdownInput(props){
  const {renderInput, data} = BaseInput(props);

  const autofocusNoSpellcheckerOptions = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
    };
  }, []);

  return renderInput((field) => {
    return (
    <>
      {!props.dontHaveLabel && <FormLabel>{data.label}</FormLabel>}
      <FormControl>
        <SimpleMDE
          options={autofocusNoSpellcheckerOptions}
          value={field.value}  
          onChange={field.onChange}
        />
      </FormControl>
      {data.description && <FormDescription>
        {data.description}
      </FormDescription>}
    </>
  )});
}
