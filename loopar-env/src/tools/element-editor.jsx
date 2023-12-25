
import DivComponent from "#div";
import loopar from "#loopar";
//import elementManage from "#tools/element-manage";
import Divider from "#divider";
import { elementsDict } from "#global/element-definition";

export default class ElementEditorClass extends DivComponent {
   formFields = [];
   hiddenElements = {};

   constructor(props) {
      super(props);

      this.state = {
         connectedElement: null,
         data: {}
      }
   }

   metaFields() {
      const genericMetaFields = this.getMetaFields();
      const selfMetaFields = this.connectedElement?.metaFields || [];

      const mergedObj = {};

      genericMetaFields.concat(selfMetaFields).forEach(item => {
         const group = item.group;
         if (!mergedObj[group]) {
            mergedObj[group] = { elements: {} };
         }

         const elements = item.elements;
         for (const key in elements) {
            mergedObj[group].elements[key] = elements[key];
         }
      });

      return Object.keys(mergedObj).map(group => ({
         group,
         elements: mergedObj[group].elements,
      }));
   }

   getMetaFields() {
      const previewProps = {}
      const animationDuration = this.state.data.aos_animation_duration || 2000;

      return [
         {
            group: 'form',
            elements: {
               //tag: {element: INPUT},
               label: { element: INPUT },
               name: { element: INPUT },
            }
         },
         {
            group: 'general',
            elements: {
               id: {
                  element: INPUT,
                  data: {
                     description: "Is a unique identifier for element"//. You can use variables like {{name}} or {{email}} to show user data.",
                  }
               },
               text: {
                  element: TEXTAREA,
                  data: {
                     description: "Is a value for inner text of element"//. You can use variables like {{name}} or {{email}} to show user data.",
                  }
               },
               background_color: { element: COLOR_PICKER },
               background_image: {
                  element: IMAGE_INPUT,
                  height: 200
               },
               background_size: {
                  element: SELECT,
                  data: {
                     options: [
                        { option: 'cover', value: 'Cover' },
                        { option: 'contain', value: 'Contain' },
                        { option: 'auto', value: 'Auto' },
                     ],
                     selected: 'cover'
                  }
               },
               color_overlay: {
                  element: COLOR_PICKER,
               },
               //background_color: {element: COLOR_PICKER},
               text_align: {
                  element: SELECT,
                  data: {
                     options: [
                        { option: 'left', value: 'Left' },
                        { option: 'center', value: 'Center' },
                        { option: 'right', value: 'Right' },
                     ],
                     selected: 'left'
                  }
               },
               size: {
                  element: SELECT,
                  data: {
                     options: [
                        { option: 'xs', value: 'Extra Small' },
                        { option: 'sm', value: 'Small' },
                        { option: 'md', value: 'Medium' },
                        { option: 'lg', value: 'Large' },
                        { option: 'xl', value: 'Extra Large' },
                     ],
                     selected: 'md'
                  }
               },
               class: { element: TEXTAREA },
               style: {
                  element: TEXTAREA,
                  data: {
                     description: "You can use raw css code here",
                  }
               },
               hidden: { element: SWITCH },
               disabled: { element: SWITCH },
               collapsed: { element: SWITCH }
            }
         },
         {
            group: 'animation',
            elements: {
               info: label({
                  style: { paddingTop: 10 },
                  className: "text-danger"
               }, "Animations allowed in Website Only"),
               animation: {
                  element: "select",
                  data: {
                     options: loopar.animations(),
                  }
               },
               animation_duration: { element: INPUT, data: { format: 'number' } },
               animation_delay: { element: INPUT, data: { format: 'number' } },
               /*easing: {
                  element: "select",
                  data: {
                     options: {
                        "ease": 'Ease',
                        "linear": 'Linear',
                        "ease-in": 'Ease In',
                        "ease-in-out": 'Ease In Out',
                        "ease-out": 'Ease Out',
                        "ease-in-back": 'Ease In Back',
                        "ease-out-back": 'Ease Out Back',
                        "ease-in-out-back": 'Ease In Out Back',
                        "ease-in-sine": 'Ease In Sine',
                        "ease-out-sine": 'Ease Out Sine',
                        "ease-in-out-sine": 'Ease In Out Sine',
                        "ease-in-quad": 'Ease In Quad',
                        "ease-out-quad": 'Ease Out Quad',
                        "ease-in-out-quad": 'Ease In Out Quad',
                        "ease-in-cubic": 'Ease In Cubic',
                        "ease-out-cubic": 'Ease Out Cubic',
                        "ease-in-out-cubic": 'Ease In Out Cubic',
                        "ease-in-quart": 'Ease In Quart',
                        "ease-out-quart": 'Ease Out Quart',
                        "ease-in-out-quart": 'Ease In Out Quart',
                        "ease-in-quint": 'Ease In Quint',
                        "ease-out-quint": 'Ease Out Quint',
                        "ease-in-out-quint": 'Ease In Out Quint',
                        "ease-in-expo": 'Ease In Expo',
                        "ease-out-expo": 'Ease Out Expo',
                        "ease-in-out-expo": 'Ease In Out Expo',
                        "ease-in-circ": 'Ease In Circ',
                        "ease-out-circ": 'Ease Out Circ',
                        "ease-in-out-circ": 'Ease In Out Circ',
                        "ease-out-elastic": 'Ease Out Elastic',
                        "ease-in-out-elastic": 'Ease In Out Elastic',
                     }
                  }
               },*/
               /*preview: div({className: "row"}, [
                  Divider({
                     style: {
                        marginTop: 10,
                        marginBottom: 10
                     },
                     label: "Preview"
                  }),
                  div({
                     style: {
                        backgroundColor: "red",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        height: "300px"
                     }
                  }, [

                     div({
                        className: "aos-init",
                        ...previewProps,
                        style: {
                           width: "50%",
                           height: "50%",
                           border: '1px solid #ccc',
                           borderRadius: 5,
                           background: 'var(--primary)'
                        },
                        ref: (ref) => {
                           setTimeout(() => {
                              if (ref) {
                                 ref.node.removeAttribute("data-aos");
                              }
                           }, animationDuration);
                        }
                     })
                  ])
               ]),*/
            }
         }
      ]
   }

   render() {
      const connectedElement = this.connectedElement || null;
      if (!connectedElement) return null;
      this.formFields = [];
      const meta = connectedElement.meta || {};
      const data = meta.data || {};
      const dontHaveMetaElements = connectedElement.dontHaveMetaElements || [];

      const metaFields = this.metaFields().map(({ group, elements }) => {
         if (group === 'form' && elementsDict[connectedElement.element].def.isWritable) {
            elements['divider_default'] = (
               <Divider
                  style={{
                     marginTop: 10,
                     marginBottom: 0,
                     color: 'red'
                  }}
                  label=""
               />
            );

            elements['default_value'] = {
               element: connectedElement.element,
               data: {
                  ...connectedElement.meta.data,
                  //id: connectedElement.meta.data.id + "_default",
                  key: connectedElement.identifier + "_default",
                  label: "Default",
                  name: "default_vaule",
                  hidden: 0
               }
            }
         }

         return { group, elements };
      });

      return super.render(
         <>
            <h5 className="pt-2" style={{ position: "absolute", zIndex: 100 }}>
               {loopar.utils.Capitalize(connectedElement.element)} Editor
            </h5>
            <Tabs
               className="nav nav-tabs"
               meta={{ data: { name: "element_editor_tabs" } }}
               headerStyle={{ paddingLeft: 0 }}
               bodyStyle={{ padding: 0 }}
               style={{ top: 25, width: "100%" }}
            >
               {metaFields.map(({ group, elements }) => {
                  return {
                     data: {
                        label: loopar.utils.Capitalize(group),
                        name: group + "_tab",
                        key: group + "_tab",
                     },
                     content: [
                        Object.entries(elements).map(([field, props]) => {
                           if (dontHaveMetaElements.includes(field)) return null;
                           if (!props.element) {
                              return props;
                           }

                           return Element(props.element, {
                              key: connectedElement.identifier + "_" + field,
                              style: props.style || {},
                              ref: self => {
                                 if (self) this.formFields[field] = self;
                              },
                              meta: {
                                 data: Object.assign({}, props.data || {}, {
                                    name: field,
                                    value: data[field] || (props.data || {}).value
                                 }),
                              },
                              onChange: () => {
                                 if (props.element === IMAGE_INPUT || props.element === COLOR_PICKER) {
                                    setTimeout(() => {
                                       this.saveData();
                                    }, 100);
                                 } else {
                                    this.saveData();
                                 }
                              }
                           })
                        })
                     ]
                  }
               })}
            </Tabs>
         </>
      );
   }

   componentDidUpdate() {
      super.componentDidUpdate();
      Object.entries(this.formFields).forEach(([fieldName, field]) => {
         if (field) {
            field.removeClass("form-group").addClass("my-1");
         }
      });
   }

   saveData() {
      const data = this.getData();
      if (loopar.Designer.updateElement(this.connectedElement.meta.data.key, data, false)) {
         this.connectedElement.meta.data = data;
      }

      this.setState({ data });
   }

   getData() {
      const data = Object.entries(this.formFields).reduce((acc, [key, field]) => {
         acc[key] = (field && field.isWritable) ? (field.mappedFiles || field.val()) : null;
         return acc;
      }, {});
      //data.id = this.connectedElement.meta.data.id || elementManage.getUniqueKey();
      data.key = this.connectedElement.identifier;

      return data;
   }

   editElement(element) {
      this.setState({ connectedElement: element });
   }

   get connectedElement() {
      return this.state.connectedElement;
   }

   editinImage(newData) {
      const currentData = this.connectedElement.meta.data;

      return (currentData.background_image !== newData.background_image)
   }
}