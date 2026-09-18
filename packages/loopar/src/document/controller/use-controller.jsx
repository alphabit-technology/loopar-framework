import { useEffect, useMemo, useRef } from "react";
import { DocumentController } from "./document-controller";
import { FormController } from "./form-controller";

/**
 * One controller instance per mount (stable identity), wired to React:
 * `props` is a live getter. `overrides`
 * (static controller options: `controller`, `notRequireChanges`,
 * `getFormValues`, `save`...) are assigned once and shadow class methods.
 */
export function useController(Controller, props, overrides) {
  const propsRef = useRef(props);
  propsRef.current = props;

  const ctrl = useMemo(() => Object.assign(
    new Controller({ get props() { return propsRef.current; } }),
    overrides,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [Controller]);

  useEffect(() => {
    ctrl.mount();
    return () => ctrl.unmount();
  }, [ctrl]);

  return ctrl;
}

export const useDocumentController = (props, overrides) => useController(DocumentController, props, overrides);
export const useFormController = (props, overrides) => useController(FormController, props, overrides);
