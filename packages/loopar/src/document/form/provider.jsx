import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { FormWrapper } from "@form-provider";

/** Form middleware: react-hook-form (FormWrapper) + the controller's form API for `useForm()`. */
const FormContext = createContext(null);

const FORM_API = [
  "getValue", "setValue", "setError", "getFormValues", "getField",
  "save", "send", "validate", "hasChanges", "checkChanges", "onFormEvent",
];

export function FormProvider({ ctrl, schema = true, children }) {
  const api = useMemo(() => {
    const bound = {};
    for (const name of FORM_API) bound[name] = ctrl[name].bind(ctrl);
    return {
      ...bound,
      ctrl,
      get form() { return ctrl.Form; },   // react-hook-form instance (set by FormWrapper)
    };
  }, [ctrl]);

  return (
    <FormContext.Provider value={api}>
      <FormWrapper
        __DATA__={ctrl.Document.data}
        STRUCTURE={schema ? ctrl.__STRUCTURE__ : undefined}
        docRef={ctrl}
      >
        {children}
      </FormWrapper>
    </FormContext.Provider>
  );
}

export function useForm() {
  const api = useContext(FormContext);
  if (!api) throw new Error("useForm() must be used inside a form entry (form, view, auth, installer, report).");
  return api;
}

/**
 * `useFormEvents({ beforeSave(values) → false cancels, afterSave(r), saveError(e) })`
 * while the caller is mounted. Inline objects are safe (ref + keys).
 */
export function useFormEvents(listeners) {
  const { onFormEvent } = useForm();
  const ref = useRef(listeners);
  ref.current = listeners || {};
  const key = Object.keys(listeners || {}).sort().join("|");

  useEffect(() => {
    const events = key ? key.split("|") : [];
    const offs = events.map((event) => onFormEvent(event, (...args) => ref.current[event]?.(...args)));
    return () => offs.forEach((off) => off());
  }, [onFormEvent, key]);
}
