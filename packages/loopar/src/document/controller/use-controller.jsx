import { useEffect, useMemo, useReducer, useRef } from "react";
import { createDocumentController } from "../controller/document-controller";
import { createFormController } from "../controller/form-controller";
import { mixin } from "../controller/mixin";

/**
 * Hook-side host for the controllers.
 *
 * Returns a controller object with a STABLE identity (created once per
 * mount) so children can keep it in memo deps / mutate its registries
 * (`__REFS__`, `__META_DEFS__`) exactly like they did with class instances.
 * `props` is a live getter, so methods always see the latest props.
 *
 * `overrides` is the functional replacement for subclass overrides
 * (`customColumns`, `getSidebar`, `primaryAction`, `setCustomActions`,
 * `controller`, `canUpdate`, ...). It is re-applied on every render so
 * closures stay fresh; getters/setters are preserved.
 */
function useControllerHost(create, props, overrides) {
  const [, bump] = useReducer((x) => x + 1, 0);
  const propsRef = useRef(props);
  propsRef.current = props;

  const ctrl = useMemo(() => create({
    get props() { return propsRef.current; },
    rerender: () => bump(),
  }), [create]);

  mixin(ctrl, overrides);

  useEffect(() => {
    ctrl.mount();
    return () => ctrl.unmount();
  }, [ctrl]);

  return ctrl;
}

/** Document-level controller (pages, lists, web views). */
export function useDocumentController(props, overrides) {
  return useControllerHost(createDocumentController, props, overrides);
}

/** Form-level controller (forms, views, installers, auth forms). */
export function useFormController(props, overrides) {
  return useControllerHost(createFormController, props, overrides);
}
