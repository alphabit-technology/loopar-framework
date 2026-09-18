'use strict';

import { useHandlers } from '@loopar/document';
import { useForm, FormLayout } from '@loopar/form';
import loopar from "loopar";

export const config = { notRequireChanges: true };

export default function TenantManagerForm() {
  const { getValue } = useForm();

  useHandlers({
    setOnProduction: () => {
      const name = getValue("name");

      loopar.confirm(`Are you sure you want to set ${name} on production?`, () => {
        loopar.call("Tenant Manager", "setOnProduction", {
          query: { name },
          success: () => loopar.refresh(),
          error: (message) => loopar.throw(message),
        });
      });
    },
  });

  return <FormLayout />;
}
