import DefaultCheckbox from "@default-checkbox";
import { Switch} from "@/components/ui/switch";

export default function MetaSwitch(props) {
  return <DefaultCheckbox {...props} Comp={Switch} />
}

MetaSwitch.metaFields = () => {
  return DefaultCheckbox.metaFields();
}