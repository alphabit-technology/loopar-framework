import BaseComponent from "$base-component";

const icons = {
  edit: "fas fa-pen",
  [COL]: "fas fa-columns",
  [ROW]: "fas fa-plus",
  [PANEL]: "fa fa-window-maximize",
  [CARD]: "fa fa-id-card",
  [BUTTON]: "fas fa-bold",
  [INPUT]: "fa fa-italic",
  [PASSWORD]: "fa fa-key",
  [INTEGER]: "fa-duotone fa-input-numeric",
  [DECIMAL]: "fa fa-00",
  [CURRENCY]: "fa fa-dollar-sign",
  [TEXTAREA]: "fa fa-text-height",
  [TEXT_EDITOR]: "fa fa-text-height",
  [MARKDOWN]: "fa fa-text-height",
  [CHECKBOX]: "far fa-check-square",
  [SWITCH]: "fas fa-toggle-on",
  //[FORM]: "fa fa-id-card",
  trash: "far fa-trash-alt",
  search: "fas fa-search",
  [SELECT]: "fas fa-search",
  [TABLE]: "fa fa-table",
  [DATE]: "fa fa-calendar-plus",
  [DATE_TIME]: "fa fa-calendar-plus",
  [TIME]: "fa fa-calendar-plus",
  //[TAG]: "fa solid fa-code",
};

export default class Icon extends BaseComponent {
  icon(props = {}, type = "primary") {
    Object.assign(this, props);

    this.data.type = type;

    this.props = this.props || {};
    this.props.class = this.props.class || "";
    this.props.style = this.props.style || "";

    this.props.class += " " + icons[type];

    super.tag("i");

    return this;
  }
}

Object.keys(icons).forEach((icon) => {
  Object.defineProperties(Icon.prototype, {
    [icon]: {
      value: function (props) {
        return this.icon(props, icon);
      },
    },
  });
});

export const icon = (options = {}) => {
  options.data = options.data || {};
  return new Icon(options);
};
