export default function BaseText(props) {
  const defaultText = "Text here";

  const getText = () => {
    return props.data.text || defaultText;
  }

  return {getText}
}

BaseText.dontHaveMetaElements = ["label"];
