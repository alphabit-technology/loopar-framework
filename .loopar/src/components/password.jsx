import BaseInput from "$base-input";
import Input from "@input";

export default class Password extends BaseInput {
  render(){
    return (
      <Input
        type="password"
        {...this.props}
      />
    );
  }
}
