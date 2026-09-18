/**
 * Form kind — logic + UI of a form entry (form, view, report, installer, auth):
 *
 *   import { useForm, useFormEvents, FormLayout } from "@loopar/form";
 *
 *   provider.jsx        FormProvider (mounted by <Entry/> above the view), useForm, useFormEvents
 *   layout.jsx          <FormLayout/>   desk chrome + structure fields + history
 *   report-layout.jsx   <ReportLayout/> desk chrome + structure, no save
 *   bare-layout.jsx     <BareLayout/>   structure only (installer, auth)
 */
export { FormProvider, useForm, useFormEvents } from "./provider";
export { FormLayout } from "./layout";
export { ReportLayout } from "./report-layout";
export { BareLayout } from "./bare-layout";
