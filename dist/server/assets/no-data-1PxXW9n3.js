import { jsx, jsxs } from "react/jsx-runtime";
function noData(props) {
  return /* @__PURE__ */ jsx("div", { className: "empty-state", children: /* @__PURE__ */ jsxs("div", { className: "empty-state-container", children: [
    /* @__PURE__ */ jsx("div", { className: "state-figure", children: /* @__PURE__ */ jsx(
      "img",
      {
        className: "img-fluid",
        src: "/assets/images/illustration/img_nodatafound.svg"
      }
    ) }),
    /* @__PURE__ */ jsx("h3", { className: "state-header", children: "No Content, Yet." }),
    /* @__PURE__ */ jsx("p", { className: "state-description lead text-muted", children: "Use the button below to add content." }),
    /* @__PURE__ */ jsx("div", { className: "state-action", children: /* @__PURE__ */ jsx("a", { className: "btn btn-primary btn-lg", href: "", children: "Add Content" }) })
  ] }) });
}
export {
  noData as default
};
