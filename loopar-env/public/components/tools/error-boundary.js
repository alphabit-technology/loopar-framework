class ErrorBoundaryClass extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    componentDidCatch(error, info) {
        this.setState({ 
            hasError: true,
            error: error,
            errorInfo: info,
        });
    }

    formatComponentStack(componentStack) {
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
    }


    render() {
        if (this.state.hasError) {
            return React.createElement("div", {
                style: { 
                    backgroundColor: 'var(--light)',
                    color: 'var(--danger)',
                    padding: '10px',
                    border: '1px solid var(--danger)',
                    borderRadius: '5px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                }
            }, [
                React.createElement("h4", null, "You have an error:"),
                React.createElement("details", {className: "text-red", style: { whiteSpace: 'pre-wrap' }}, [
                    this.state.error && this.state.error.toString(),
                    React.createElement("br", null),
                    this.state.errorInfo && this.state.errorInfo.componentStack,
                ]),
            ]);
        }

        return this.props.children;
    }
}

export const ErrorBoundary = (props, content) => {
    return React.createElement(ErrorBoundaryClass, props, content);
};