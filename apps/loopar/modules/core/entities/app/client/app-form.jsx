'use strict';

import { useForm, FormLayout } from '@loopar/form';
import { loopar } from 'loopar';
import { Button } from '@cn/components/ui/button';
import { PlusIcon } from 'lucide-react';

export default function AppForm() {
  const { getValue, setValue } = useForm();

  /** AppBar action: bumps one semver segment of the app being edited. */
  const incrementVersion = (type) => (
    <Button
      variant="link"
      onClick={(e) => {
        e.preventDefault();
        const name = getValue('name');

        loopar.confirm(`Are you sure you want to increment the ${type} version of the app ${name}?`, () => {
          loopar.call("App", `increment${type}`, {
            query: { name },
            success: (result) => setValue('version', result.version),
          });
        });
      }}
    >
      <PlusIcon className="mr-2" />
      {type}
    </Button>
  );

  return (
    <FormLayout
      actions={{
        incrementPatch: incrementVersion('Patch'),
        incrementMinor: incrementVersion('Minor'),
        incrementMajor: incrementVersion('Major'),
      }}
    />
  );
}
