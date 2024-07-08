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

function MarkdownEditor({ field}) {
  const autofocusNoSpellcheckerOptions = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
    };
  }, []);

  return (
    <SimpleMDE
      options={autofocusNoSpellcheckerOptions}
      value={field.value}  
      onChange={field.onChange}
    />
  );
}

export default class MarkdownInput extends BaseInput {
  render() {
    const data = this.data;

    return this.renderInput((field) => {
      return (
      <>
        {!this.props.dontHaveLabel && <FormLabel>{data.label}</FormLabel>}
        <FormControl>
          <MarkdownEditor field={field}/>
        </FormControl>
        {data.description && <FormDescription>
          {data.description}
        </FormDescription>}
      </>
    )});
  }
}
