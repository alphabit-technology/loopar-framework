import { jsx, jsxs } from "react/jsx-runtime";
function Divider(props) {
  return /* @__PURE__ */ jsx("li", { ...props, className: `log-divider ${props.className}`, children: /* @__PURE__ */ jsxs("span", { children: [
    props.icon ? /* @__PURE__ */ jsx("i", { className: props.icon }) : null,
    props.label ? /* @__PURE__ */ jsx("strong", { children: props.label }) : null
  ] }) });
}
export {
  Divider as default
};
