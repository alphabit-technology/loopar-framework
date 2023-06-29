import {div} from "/components/elements.js";
import Component from "/components/base/component.js";
import {HTML} from "/components/base/html.js";

export default class BaseDocument extends HTML {
	customActions = {};
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

	addCustomAction(name, action) {
		this.customActions[name] = action;
	}
}