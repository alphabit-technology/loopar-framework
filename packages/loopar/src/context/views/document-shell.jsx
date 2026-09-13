import { DocumentProvider } from "@context/@/document-context";

/**
 * Outer shell of every entry point: publishes the controller as `docRef`
 * through `DocumentProvider` and sets the page title. Used by the class
 * adapters (`BaseDocument.render`) and by the functional views alike.
 */
export function DocumentShell({ ctrl, slots, children }) {
  const Document = ctrl.Document;

  return (
    <DocumentProvider
      docRef={ctrl}
      formValues={ctrl.getFormValues ? ctrl.getFormValues() : {}}
      name={Document.name}
      title={Document.meta.title}
      spacing={Document.spacing}
      Document={Document}
      slots={slots}
    >
      <>
        <title>{Document.meta.title}</title>
        {children}
      </>
    </DocumentProvider>
  );
}
