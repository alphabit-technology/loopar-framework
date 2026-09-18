'use strict';

import { useHandlers } from '@loopar/document';
import { useForm, FormLayout } from '@loopar/form';
import { loopar } from "loopar";

export default function EmailSettingsForm() {
  const { send, getFormValues } = useForm();

  useHandlers({
    /** "Test Connection" button (`data.action: "testConnection"`). */
    testConnection: () => {
      send({ action: "testConnection", notRequireChanges: true, query: getFormValues() }, (r) => {
        if (r.success) {
          loopar.notify("Connection successful", "success");
        } else {
          loopar.notify(r.message, "error", "Connection failed");
        }
      }, () => {
        loopar.notify("Connection failed", "error");
      });
    },
  });

  return <FormLayout />;
}
