import { FormWrapper } from "@context/form-provider";
import { useRef, useState } from "react";
import { Droppable } from "@droppable";
import { loopar } from "loopar";
import { Button } from "@cn/components/ui/button";
import { cn } from "@cn/lib/utils";
import {useDocument} from "@context/@/document-context";

export default function MetaForm(props) {
  const formRef = useRef(null);
  const { title = "Form Data", document, action, action_text = "Submit", render_response } = props.data;
  const [saved, setSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState(null)
  const {data={}} = useDocument()?.Document;

  const submit = async () => {
    const api = formRef.current;
    if (!api) return;
    const submited = await api.submit();

    if (!submited) return;
    const res = await loopar.method(document, action, {

    }, {
      body: submited
    });

    setSavedMessage(res)
  };

  if(render_response && savedMessage){
    return <p>{savedMessage}</p>
  }

  return (
    <FormWrapper
      STRUCTURE={props.elements}
      __DATA__={data}
      className="w-full"
      formRef={formRef}
    >
      <div className="w-full border">
        <div className="p-4">
          <p className="text-md font-medium tracking-widest uppercase text-muted-foreground">
            {title}
          </p>

          <div className="p-2">
            <Droppable {...props} />
          </div>

          <div className={cn(
            "flex justify-end gap-2 pt-4",
            "border-t border-border/40"
          )}>
            <Button
              type="button"
              size="sm"
              onClick={submit}
            >
              {action_text}
            </Button>
          </div>
        </div>
      </div>
    </FormWrapper>
  );
}

MetaForm.metaFields = () => [{
  group: "form",
  elements: {
    title: { element: INPUT },
    document: { element: INPUT },
    action: { element: INPUT },
    action_text: { element: INPUT },
    render_response: {element: SWITCH},
    succes_message: {element: TEXTAREA},
    error_message: {element: TEXTAREA}
  }
}];