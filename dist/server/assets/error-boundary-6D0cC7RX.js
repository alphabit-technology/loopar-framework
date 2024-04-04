import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const formatComponentStack = (componentStack) => {
    const stackLines = componentStack.split("\n");
    const formattedStackLines = stackLines.map((line) => {
      const filePathIndex = line.indexOf(" (");
      if (filePathIndex > -1) {
        const cleanLine = line.substring(0, filePathIndex);
        return cleanLine.trim();
      }
      return line;
    });
    return formattedStackLines.join("\n");
  };
  if (hasError) {
    return /* @__PURE__ */ jsxs("div", { style: {
      backgroundColor: "var(--light)",
      color: "var(--danger)",
      padding: "10px",
      border: "1px solid var(--danger)",
      borderRadius: "5px",
      fontFamily: "monospace",
      whiteSpace: "pre-wrap"
    }, children: [
      /* @__PURE__ */ jsx("h4", { children: "You have an error:" }),
      /* @__PURE__ */ jsxs("details", { className: "text-red", style: { whiteSpace: "pre-wrap" }, children: [
        error && error.toString(),
        /* @__PURE__ */ jsx("br", {}),
        errorInfo && formatComponentStack(errorInfo.componentStack)
      ] })
    ] });
  }
  return /* @__PURE__ */ jsx(Fragment, { children });
};
export {
  ErrorBoundary as default
};
