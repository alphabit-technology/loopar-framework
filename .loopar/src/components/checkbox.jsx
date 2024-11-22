import DefaultCheckbox from '@default-checkbox';

export default function MetaCheckbox(props) {
  return <DefaultCheckbox {...props} />
}

MetaCheckbox.metaFields = () => {
  return DefaultCheckbox.metaFields();
}