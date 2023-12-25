import React, { useState, useEffect } from 'react';
import { elementsDict as baseElementsDict } from '#global/element-definition';
import loopar from '#loopar';
import { Components as ImportedComponents } from '#components-loader';

console.log("Components", ImportedComponents)
/*console.log("elementsDict", elementsDict);

const componentsMap = Object.entries(elementsDict).reduce((acc, el) => {
    acc[loopar.utils.Capitalize(loopar.utils.camelCase(el.element))] = () => import(`./${el.element.replaceAll("_", "-").toLowerCase() }`);
    return acc;
}, {});*/

const designElementProps = (props) => {
}

const elementProps = (elDict, props, parent = {}) => {
    //const parent = props.parentRef;
    if (parent.props.designer) return designElementProps(elDict, props);

    elDict.data ??= {};
    if (elDict.data.hidden && !parent.props.designer) return null;

    if (parent.data.static_content) {
        elDict.data.animation = loopar.reverseAnimation(parent.animation);
    }

    parent.props.docRef && (props.docRef = parent.props.docRef);
    parent.props.docRef?.readOnly && (props.readOnly = true);

    const Props = {
        element: elDict.element,
        ...{
            key: 'element' + elDict.data.key,
            ref: self => {
                if (self) {
                    /*For inputs and other elements that have a name and have */
                    if (parent.props.docRef && elDict.data.name) {
                        if (self.isWritable) {
                            /*For inputs elements*/
                            parent.props.docRef.formFields[elDict.data.name] = self;
                        } else {
                            /*For other elements*/
                            parent.props.docRef[elDict.data.name] = self;
                        }
                    }
                }
            },
            meta: {
                ...elDict
            },
        }, ...props
    }

    return Props;
}

function getComponentsMap(elements) {
    return elements.map(el => {
        return baseElementsDict[el.element]?.def?.element;
    });
}

function getComponents(elements = [], props, parent) {
    const components = [];

    if (elements && Array.isArray(elements)) {
        for (const el of elements) {
            const def = baseElementsDict[el.element].def;
            el.def = def;
            try {
                const Comp = ImportedComponents[def.element];
                if(!Comp){
                    console.log("**********************COMPONENT", def.element)
                }

                //console.log("**********************COMPONENT", def.element, Comp)
                components.push(<Comp.default {...elementProps(el, props, parent)} />);
                
            } catch (error) {
                console.warn("Error on getComponents", error)
                //console.log("error", error);
            }

        }
    }

    return components;
}

const DynamicComponent = ({ elements, props, parent }) => {
    //console.log("DynamicComponent", elements, props, parent)
    //const [loadedComponentes, setLoadedComponentes] = useState([]);
    const [Components, setComponents] = useState(null);
    //let Components = null;
    /*useEffect(() => {
        if (!Components) getComponents(elements, props, parent).then(setComponents);
    });*/

    //!Components && loopar.loadComponents(getComponentsMap(elements)).then(() => {
    !Components && setComponents(getComponents(elements, props, parent));
    //});

    if (Components) {
        return (
            <>
                {Components}
            </>
        )
    }

    /*const [AsyncComponent, setAsyncComponent] = useState(null);

    const Component = componentsMap[props.element];
    const options = {...props, def: elementsDict[props.element].def };
    options.meta ??= {};

    return (
        <Component {...metadata.props}/>
    );*/
};

export default DynamicComponent;
