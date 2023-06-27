import {div} from "/components/elements.js";
import {HTML} from "/components/base/html.js";

export default class BaseDocument extends HTML {
	constructor(props) {
		super(props);

		this.state = {
			...this.state,
			sidebar_open: false,
			design: false,
			preview: false,
		}
	}

	get meta() {
		return this.props.meta;
	}
}