import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useWatch,
  type UseFormReturn,
  type FieldValues,
} from "react-hook-form";
import React, {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { dataInterface } from "@global/element-definition";
import { loopar } from "loopar";
import * as z from "zod";

import { Form } from "@cn/components/ui/form";

/** Globals defined at runtime (e.g. `element-definition.js`). */
declare function fieldIsWritable(field: unknown): boolean | undefined;
declare function ELEMENT_DEFINITION(
  element: unknown,
  or?: unknown | null,
): { element: string };
declare const FORM_TABLE: string;

export interface FormFieldData {
  id?: string;
  name: string;
  type?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  value?: unknown;
  hidden?: number | boolean;
}

/** Form structure node (document / designer). */
export interface FormStructureElement {
  element: string;
  hidden?: boolean;
  data: FormFieldData;
  readOnly?: boolean;
  designer?: boolean;
  droppable?: boolean;
  fieldDesigner?: boolean;
  docRef?: unknown;
  meta?: Record<string, unknown>;
  ref?: () => void;
  elements?: FormStructureElement[];
}

type MappedFormField = {
  data: FormFieldData;
  def: { element: string };
  element?: string;
  value?: unknown;
};

/** Reference to the document / screen context that receives submit. */
export interface LooparFormDocRef {
  save?: (values: FieldValues) => void | Promise<void>;
  Form?: UseFormReturn<FieldValues>;
  /** In real documents this is often a subset of `FormState` or a custom map. */
  formFields?: unknown;
}

/** API exposed on `formRef` after `FormProvider` mounts. */
export type LooparFormImperativeApi = {
  trigger: UseFormReturn<FieldValues>["trigger"];
  getValues: UseFormReturn<FieldValues>["getValues"];
  /** `true` if validation passed and `onSubmit` ran; `false` if there were errors. */
  submit: () => Promise<boolean>;
  form: UseFormReturn<FieldValues>;
};

type LooparBaseFormContext = UseFormReturn<FieldValues> & {
  values: FieldValues | undefined;
  docRef?: LooparFormDocRef | null;
};

export const BaseFormContext = createContext<LooparBaseFormContext | undefined>(
  undefined,
);

const FILE_ELEMENTS = new Set([IMAGE_INPUT, FILE_INPUT]);

const buildFormFields = (
  STRUCTURE: FormStructureElement[] | undefined,
): Record<string, z.ZodTypeAny> => {
  const acc: Record<string, z.ZodTypeAny> = {};

  for (const el of STRUCTURE ?? []) {
    const { data } = el;
    const name = data?.name;

    if (typeof name === "string" && name && fieldIsWritable(el)) {
      if (el.element === FORM_TABLE) {
        // FORM_TABLE is handled outside the zod schema.
      } else if (FILE_ELEMENTS.has(el.element)) {
        acc[name] = z.array(
          z.object({ rawFile: z.instanceof(File).optional() }).passthrough()
        ).optional();
      } else {
        acc[name] = data.required
          ? z.string().min(1, "Required")
          : z.string().optional();
      }
    }

    if (el.elements?.length) {
      Object.assign(acc, buildFormFields(el.elements));
    }
  }

  return acc;
};

export type FormProviderProps = {
  children: React.ReactNode;
  values?: FieldValues;
  docRef?: LooparFormDocRef | null;
  formRef?: React.MutableRefObject<LooparFormImperativeApi | null> | null;
  STRUCTURE?: FormStructureElement[];
  onChange?: (values: FieldValues | undefined) => void;
};

export const FormProvider = ({
  children,
  values,
  docRef,
  formRef,
  STRUCTURE,
  onChange,
}: FormProviderProps) => {
  const FormSchema = useMemo(
    () => z.object(buildFormFields(STRUCTURE)),
    [STRUCTURE],
  );

  const form = useForm<FieldValues>({
    defaultValues: values,
    resolver: zodResolver(FormSchema),
  });

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    onChange?.(watchedValues);
  }, [watchedValues, onChange]);

  /**
   * Assigning `docRef.Form` is an intentional synchronous side-effect during render.
   * `BaseForm.componentDidMount()` calls `buildSettersAndGetters()`, which expects
   * `this.#Form` to already be set. Moving this to `useEffect` / `useLayoutEffect`
   * would mount the parent with `this.#Form === null` and break the setters.
   * The operation is idempotent (no re-renders triggered) and cheap — the setter
   * in `BaseForm` only stores the reference without cloning.
   */
  if (docRef) {
    docRef.Form = form;
    docRef.formFields = form.formState;
  }

  const mapStructureToFields = useCallback(
    (fields: FormStructureElement[]): MappedFormField[] =>
      fields.reduce<MappedFormField[]>((list, el) => {
        list.push({
          data: el.data,
          def: ELEMENT_DEFINITION(el.element),
        });
        if (el.elements?.length) {
          list.push(...mapStructureToFields(el.elements));
        }
        return list;
      }, []),
    [],
  );

  const validate = useCallback(() => {
    const fields = mapStructureToFields(STRUCTURE ?? []);
    const errors: { field: string; message: string }[] = [];

    for (const [key, value] of Object.entries(form.getValues())) {
      const field = fields.find((f) => f.data?.name === key);
      if (!field) continue;

      field.value = value;

      if ([FORM_TABLE].includes(field.def.element)) {
        continue;
      }
      field.element = field.def.element;
      const validator = dataInterface(field, value).validate();
      if (!validator.valid) {
        errors.push({
          field: field.data.name,
          message: validator.message,
        });
      }
    }

    if (errors.length > 0) {
      loopar.throw({
        type: "error",
        title: "Validation error",
        message: errors.map((e) => e.message).join("\n"),
      });
    }
  }, [STRUCTURE, form, mapStructureToFields]);

  const onSubmit = useCallback(
    (submitted: FieldValues) => {
      validate();
      docRef?.save?.(submitted);
    },
    [docRef, validate],
  );

  useEffect(() => {
    if (!formRef) return;
    formRef.current = {
      trigger: form.trigger.bind(form),
      getValues: form.getValues.bind(form),
      submit: () =>
        new Promise<boolean>((resolve) => {
          void form.handleSubmit(
            (vals) => {
              onSubmit(vals);
              resolve(vals);
            },
            () => {
              resolve(false);
            },
          )();
        }),
      form,
    };
    return () => {
      formRef.current = null;
    };
  }, [formRef, form, onSubmit]);

  const contextValue = useMemo<LooparBaseFormContext>(
    () => ({
      ...form,
      values: watchedValues,
      docRef: docRef ?? undefined,
    }),
    [form, watchedValues, docRef],
  );

  const handleFormSubmit = useMemo(
    () => form.handleSubmit(onSubmit),
    [form, onSubmit],
  );

  return (
    <BaseFormContext.Provider value={contextValue}>
      <Form {...form} noValidate onSubmit={handleFormSubmit}>
        {children}
      </Form>
    </BaseFormContext.Provider>
  );
};

export function useFormContext(): LooparBaseFormContext {
  const ctx = useContext(BaseFormContext);
  if (ctx === undefined) {
    throw new Error(
      "useFormContext must be used within FormWrapper / FormProvider.",
    );
  }
  return ctx;
}

export type FormWrapperProps = {
  __DATA__?: FieldValues;
  docRef?: LooparFormDocRef | null;
  children: React.ReactNode;
  formRef?: React.MutableRefObject<LooparFormImperativeApi | null> | null;
  STRUCTURE?: FormStructureElement[];
  onChange?: (values: FieldValues | undefined) => void;
};

export function FormWrapper({
  __DATA__,
  docRef,
  children,
  formRef,
  STRUCTURE,
  onChange,
}: FormWrapperProps) {
  return (
    <FormProvider
      values={__DATA__}
      docRef={docRef}
      formRef={formRef}
      STRUCTURE={STRUCTURE}
      onChange={onChange}
    >
      {children}
    </FormProvider>
  );
}
