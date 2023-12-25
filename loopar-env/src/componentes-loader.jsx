const Components = {};

let extractedElements = [];
const extractElements = (elements) => {
    for (const element of elements) {
        extractedElements.push(element.element);

        if (element.elements) {
            extractElements(element.elements);
        }
    }
}

function getComponent(component, pre = "./") {
    const cParse = component.replaceAll(/_/g, "-");
    return new Promise(resolve => {
        if (Components[component]) {
            resolve(Components[component]);
        } else {
            import(`./components/${cParse}.jsx`).then(c => {
                Components[component] = c;
                resolve(c);
            });
        }
    });
}

async function loadComponents(components, callback) {
    const promises = Array.from(new Set(components)).map(c => getComponent(c));
    return Promise.all(promises).then(callback);
}

async function ComponentsLoader(elementsList){
    extractElements(elementsList);
    const elements = Array.from(new Set(extractedElements));
    await loadComponents(elements);
}

export { ComponentsLoader, Components }