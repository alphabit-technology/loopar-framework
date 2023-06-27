class DocumentClass {
    constructor(props) {
        Object.assign(this, props);
    }

    ready(fn) {
        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(fn(), 1);
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }
}

window.Document = new DocumentClass();