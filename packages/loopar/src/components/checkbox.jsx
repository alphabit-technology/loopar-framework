import DefaultCheckbox from './base/default-checkbox.jsx';

export default function MetaCheckbox(props) {
  return <DefaultCheckbox {...props} />
}

MetaCheckbox.metaFields = () => {
  return DefaultCheckbox.metaFields();
}