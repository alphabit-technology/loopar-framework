/*import { div } from "/components/elements.js";
import Component from "/components/base/component.js";
import { HTML } from "/components/base/html.js";*/

/*export default class BaseDocument extends HTML {
	customActions = {};
	constructor(props) {
		super(props);

		this.state = {
			...this.state,
			sidebarOpen: false,
			design: false,
			preview: false,
		}
	}

	get meta() {
		return this.props.meta;
	}

	setCustomAction(name, action) {
		this.customActions[name] = action;
		this.setState({});
	}

	setCustomActions() { }

	getPageKey() {
		return this.meta.key;
	}

	initScroll() {
		
		const scrollPosition = localStorage.getItem(this.getPageKey()) || 0;
		setTimeout	(() => {
			console.log("init scroll", this.getPageKey(), scrollPosition);
			window.scrollTo(0, scrollPosition);
		}, 1000);
		//window.scrollTo(0, scrollPosition);
		window.addEventListener("beforeunload", this.handleBeforeUnload);
	}

	setScrollPosition() {
		localStorage.setItem(this.getPageKey(), window.scrollY || window.pageYOffset);
	}

	componentWillUnmount() {
		super.componentWillUnmount();
		window.removeEventListener("beforeunload", this.handleBeforeUnload);
		this.setScrollPosition();
	}

	handleBeforeUnload = () => {
		this.setScrollPosition();
	};
}*/