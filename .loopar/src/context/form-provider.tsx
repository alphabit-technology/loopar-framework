import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { createContext, useContext } from "react";
import * as z from "zod";

import {
  Form
} from "@/components/ui/form";

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

interface MetaInterface {
  key: String,
  __ENTITY__: {
    STRUCTURE: Array<Element>
  },
  __DOCUMENT__: {}
}

export const BaseFormContext = createContext({});

export const FormProvider = ({ children, defaultValues, docRef, meta }: any) => {
  const FormSchema = z.object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
  })

  const form = useForm({
    defaultValues,
    resolver: zodResolver(FormSchema),
  });

  //docRef && (docRef.formValues = form.watch());
  docRef && (docRef.Form = form);

  function onSubmit(values: z.infer<typeof FormSchema>) {
    docRef && (docRef.save());
  }

  docRef && (docRef.formFields = form.formState);

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

export function FormWrapper({ meta, docRef, children }: { meta: MetaInterface, docRef: FormContext, children: React.ReactNode }) {
  return (
    <FormProvider defaultValues={meta.__DOCUMENT__} docRef={docRef} meta={meta}>
      {children}
    </FormProvider>
  )
}