import React from 'react';
import { ErrorBoundary as Boundary} from "react-error-boundary";

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
}

function fallbackRender({ error, resetErrorBoundary }) {
  console.log(["error", error])
  return (
    <div style={{
      backgroundColor: 'var(--light)',
      color: 'var(--danger)',
      padding: '10px',
      border: '1px solid var(--danger)',
      borderRadius: '5px',
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
    }}>
      <h4>You have an error:</h4>
      <details className="text-red" style={{ whiteSpace: 'pre-wrap' }}>
        <p>Error</p>
        {error.message}
        <br />
        {formatComponentStack(error.stack)}
      </details>
    </div>
  );
}

export function ErrorBoundary(props) {
  return (
    <Boundary
      fallbackRender={fallbackRender}
      onReset={(details) => {
        // Reset the state of your app so the error doesn't happen again
      }}
    >
      {props.children}
    </Boundary>
  )
}