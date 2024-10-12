import React, { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  formatComponentStack(componentStack) {
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

  render() {
    if (this.state.hasError) {
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
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.formatComponentStack(this.state.errorInfo.componentStack)}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}