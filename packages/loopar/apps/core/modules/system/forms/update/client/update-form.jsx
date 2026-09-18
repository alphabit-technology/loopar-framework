import { useHandlers } from '@loopar/document';
import { useForm, BareLayout } from '@loopar/form';

export default function UpdateForm() {
  const { send } = useForm();

  useHandlers({
    update: () => send({ action: "update", query: { app_name: "loopar" } }),
  });

  return <BareLayout />;
}
