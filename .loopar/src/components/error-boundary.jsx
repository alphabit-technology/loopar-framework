import React, { useState } from 'react';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  const componentDidCatch = (error, info) => {
    setHasError(true);
    setError(error);
    setErrorInfo(info);
  };

  const formatComponentStack = (componentStack) => {
    const stackLines = componentStack.split("\n");
    const formattedStackLines = stackLines.map(line => {
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
          {error && error.toString()}
          <br />
          {errorInfo && formatComponentStack(errorInfo.componentStack)}
        </details>
      </div>
    );
  }

  return <>{children}</>;
};

export default ErrorBoundary;
