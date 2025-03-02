import React from "react";

export function SEORender(props){
  const { data={} } = props;

  const options = (data.options || "").split("\n").reduce((acc, item) => {
    const [key, value=""] = item.split("=");
    acc[key] = value;

    return acc;
  }, {});

  const tagName = data.meta_name || "meta";
  if(tagName === "title"){
    return <title>{options.content}</title>;
  }

  return React.createElement(data.meta_name || "meta", {...options, key: options.content});
}