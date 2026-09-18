import { useHandlers } from '@loopar/document';
import { useForm, BareLayout } from '@loopar/form';

export default function InstallerForm() {
  const { send } = useForm();

  useHandlers({
    install: () => send({ action: "install", query: { app_name: "loopar" } }),
  });

  return <BareLayout />;
}
