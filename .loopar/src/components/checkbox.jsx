import DefaultCheckbox from '$default-checkbox';
import { Checkbox as BaseCheckbox} from "@/components/ui/checkbox";


export default class Checkbox extends DefaultCheckbox {
    
  render() {
    const data = this.data;
    return super.render(<BaseCheckbox {...data} />);
    /*return (
      <FormGroup>
        <FormControlLabel
          control={<Checkbox checked={data.value} color="success" />}
          label={data.label}
          onChange={this.handleInputChange.bind(this)}
        />
      </FormGroup>
    );*/
  }
}