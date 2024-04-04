import Component from "$component";
import Row from "@row"

export default class Panel extends Component {
  render() {
    return <Row {...this.props}/>
  }
}
