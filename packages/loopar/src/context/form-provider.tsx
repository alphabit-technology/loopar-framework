import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { createContext, useContext } from "react";
import * as z from "zod";

import {
  Form
} from "@cn/components/ui/form";

interface DataInterface {
  id: String,
  name: String,
  type: String,
  label: String,
  description: String,
  placeholder: String,
  required: Boolean,
  value: String
}

interface Element {
  element: String,
  hidden: Boolean,
  data: DataInterface,
  readOnly: Boolean,
  designer: Boolean,
  droppable: Boolean,
  fieldDesigner: Boolean,
  docRef: FormContext,
  meta: {}
  ref: Function,
}

interface __DOCUMENT__ {

}

// interface MetaInterface {
//   key: String,
//   __ENTITY__: {
//     STRUCTURE: Array<Element>
//   },
//   __DOCUMENT__: {}
// }

interface docRef {

}

export const BaseFormContext = createContext({});

const buildFormFields = (STRUCTURE: Array<Element>) => {
  return (STRUCTURE || []).reduce((acc: any, el: Element) => {
    const { data } = el;
    const { name, required } = data;

    if (fieldIsWritable(el)) {
      acc[name] = z.optional();
      //acc[name] = z.string().optional();

      if (required) {
        acc[name] = z.string().nonempty();
      }
    }

    if (el.elements) {
      acc = {
        ...acc,
        ...buildFormFields(el.elements)
      }
    }

    return acc;
  }, {});
}

export const FormProvider = ({ children, values, docRef, formRef, STRUCTURE }: any) => {
  const FormSchema = z.object(buildFormFields(STRUCTURE))

  const form = useForm({
    values,
    resolver: zodResolver(FormSchema),
  });

  docRef && (docRef.Form = form);

  function onSubmit(values: z.infer<typeof FormSchema>) {
    docRef && (docRef.save(values));
  }

  docRef && (docRef.formFields = form.formState);

  formRef && (formRef.current = form);
  return (
    <BaseFormContext.Provider value={form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {children}
        </form>
      </Form>
    </BaseFormContext.Provider>
  );
};

export const useFormContext = () => useContext(BaseFormContext);

export function FormWrapper(
  { __DOCUMENT__, docRef, children, formRef, STRUCTURE }: { __DOCUMENT__: __DOCUMENT__, docRef: docRef, children: React.ReactNode, formRef: Function, STRUCTURE: Array<Element> }
) {
  return (
    <FormProvider values={__DOCUMENT__} docRef={docRef} formRef={formRef} STRUCTURE={STRUCTURE}>
      {children}
    </FormProvider>
  )
}