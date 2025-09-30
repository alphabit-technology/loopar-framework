import Input from "@input";
import BaseInput from "@base-input";

export default function Password(props){
  return (
    <Input
      type="password"
      {...props}
    />
  );
}

Password.metaFields = () => {
  return [
    ...BaseInput.metaFields(),
  ]
}