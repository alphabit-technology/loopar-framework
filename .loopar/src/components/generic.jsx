import Component from "$component";
import loopar from "$loopar";
import React from "react";
import { Droppable } from "$droppable";

export default class Generic extends Component {
  //blockComponent = true;
  //dontHaveContainer = true;
  dontHaveMetaElements = ["label"];

  validateTag(tag) {
    const validTags = [
      "div",
      "span",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "i",
      "ul",
      "li",
      "img",
      "input",
      "button",
      "form",
      "label",
      "select",
      "option",
      "textarea",
      "table",
      "tr",
      "td",
      "th",
      "thead",
      "tbody",
      "tfoot",
      "nav",
      "header",
      "footer",
      "main",
      "section",
      "article",
      "aside",
      "blockquote",
      "br",
      "hr",
      "iframe",
      "map",
      "area",
      "audio",
      "video",
      "canvas",
      "datalist",
      "details",
      "embed",
      "fieldset",
      "figure",
      "figcaption",
      "mark",
      "meter",
      "object",
      "output",
      "progress",
      "q",
      "ruby",
      "rt",
      "rp",
      "samp",
      "script",
      "style",
      "summary",
      "time",
      "track",
      "var",
      "wbr",
    ];

    return validTags.includes(tag);
  }

  render(content) {
    const data = this.props.data;
    const tag = this.props.tag || data.tag;
    this.tagName = this.validateTag(tag) ? tag : "div";

    if (this.tagDontHaveChild(tag) && this.elementsDict.length > 0) {
      loopar.dialog({
        title: "Warning",
        message: `This element have a child element, but the tag "${this.tagName}" don't have child elements. will be used the tag "div" instead.`,
        buttons: [
          {
            label: "Ok",
            className: "btn btn-primary",
            onClick: () => {
              loopar.closeDialog();
            },
          },
        ],
      });

      this.tagName = "div";
    }

    if (this.tagDontHaveChild(data.tag)) {
      this.tagName = data.tag;
      this.dontHaveContainer = true;

      return super.render([
        React.createElement(data.tag, this.props)
      ]);
    }

    return (
      <Droppable Component={data.tag} {...this.props}/>
    )
    /*return super.render(
      this.elementsDict.length === 0 ? this.props.children : ""
    );*/
  }

  get metaFields() {
    return [
      {
        group: "HTML",
        elements: {
          tag: { element: INPUT },
        },
      },
    ];
  }
}
