'use strict';

import { useFieldEvent } from '@loopar/document';
import { useForm, FormLayout } from '@loopar/form';

export default function FileManagerForm() {
  const { setValue } = useForm();

  // Derive name/extension/size/type from the picked file.
  useFieldEvent("file_ref", "change", (e) => {
    const data = e.target?.value ? e.target?.value[0] || {} : {};

    setValue("name", data.name || "");
    setValue("extention", (data.name || "").split(".").pop());
    setValue("size", data.size || 0);
    setValue("type", data.type || "");
  });

  return <FormLayout />;
}
