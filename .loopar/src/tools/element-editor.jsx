
import DivComponent from "$div";
import loopar from "$loopar";
import { elementsDict } from "$global/element-definition";
import Tabs from "@tabs"
import { MetaComponent } from "@dynamic-component";
import { Separator } from "@/components/ui/separator";
import Tab from "@tab";

export default class ElementEditorClass extends DivComponent {
  formValues = [];
  hiddenElements = {};

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      connectedElement: props.connectedElement,
      data: props.connectedElement?.data || {}
    }

    this.formValues = props.connectedElement?.data || {};
  }

  metaFields() {
    const genericMetaFields = this.getMetaFields();
    const selfMetaFields = this.props.connectedElement?.metaFields || [];

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

  get data () {
    return this.state.data || {};
  }

  getMetaFields() {
    const previewProps = {}
    const animationDuration = this.data.aos_animation_duration || 2000;
    const data = this.formValues

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
          background_image: {
            element: IMAGE_INPUT,
            height: 200
          },
          background_color: { element: COLOR_PICKER },
          background_blend_mode: {element: SELECT, data: {
            options: [
              { option: 'normal', value: 'Normal' },
              { option: 'multiply', value: 'Multiply' },
              { option: 'screen', value: 'Screen' },
              { option: 'overlay', value: 'Overlay' },
              { option: 'darken', value: 'Darken' },
              { option: 'lighten', value: 'Lighten' },
              { option: 'color-dodge', value: 'Color Dodge' },
              { option: 'color-burn', value: 'Color Burn' },
              { option: 'hard-light', value: 'Hard Light' },
              { option: 'soft-light', value: 'Soft Light' },
              { option: 'difference', value: 'Difference' },
              { option: 'exclusion', value: 'Exclusion' },
              { option: 'hue', value: 'Hue' },
              { option: 'saturation', value: 'Saturation' },
              { option: 'color', value: 'Color' },
              { option: 'luminosity', value: 'Luminosity' },
            ],
            selected: 'overlay'
          }},
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
          class: {
            element: TAILWIND, 
            data: {
              rows: 10,
              to_element: data.key,
              label: "Tailwind" 
            }
          },
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
          info: <label
            style={{ paddingTop: 10 }}
            className="text-danger"
          >Animations allowed in Website Only</label>,
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

  render1() {
    const connectedElement = this.connectedElement || null;
    if (!connectedElement) return null;
    const data = this.formValues;

    const dontHaveMetaElements = connectedElement.dontHaveMetaElements || [];

    const metaFields = this.metaFields().map(({ group, elements }) => {
      if (group === 'form' && elementsDict[connectedElement.element].def.isWritable) {
        elements['divider_default'] = (
          <Separator className="my-3"/>
        );

        elements['default_value'] = {
          element: connectedElement.element,
          data: {
            ...connectedElement.data,
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

    return (
      <div className="flex flex-col">
        <h1 className="pt-2 text-xl">
          {loopar.utils.Capitalize(connectedElement.element)} Editor
        </h1>
        <Tabs
          data={{ name: "element_editor_tabs" }}
          key={connectedElement.identifier + "_tabs"}
        >
          {metaFields.map(({ group, elements }) => {
            return {
              data: {
                label: loopar.utils.Capitalize(group),
                name: group + "_tab",
                key: group + "_tab"
              },
              content: [
                Object.entries(elements).map(([field, props]) => {
                  if (dontHaveMetaElements.includes(field)) return null;
                  if (!props.element) {
                    return props;
                  }

                  const value = data[field];
                  this.formValues[field] = value;

                  return (
                    <MetaComponent
                      component={props.element}
                      render={Component => (
                        <Component
                          key={connectedElement.identifier + "_" + field}
                          dontHaveForm={true}
                          data={{
                            ...props.data,
                            name: field,
                            value: value
                          }}
                          onChange={(e) => {
                            this.formValues[field] = e.target ? e.target.value : e;
                            this.saveData();
                          }}
                        />
                      )}
                    />
                  )
                })
              ]
            }
          })}
        </Tabs>
      </div>
    );
  }

  render() {
    const connectedElement = this.connectedElement || null;
    if (!connectedElement) return null;
    const data = this.formValues;
    typeof data.options === 'object' && (data.options = JSON.stringify(data.options));

    console.log(["Element Editor", data]);
    const dontHaveMetaElements = connectedElement.dontHaveMetaElements || [];

    const metaFields = this.metaFields().map(({ group, elements }) => {
      if (group === 'form' && elementsDict[connectedElement.element].def.isWritable) {
        elements['divider_default'] = (
          <Separator className="my-3"/>
        );

        elements['default_value'] = {
          element: connectedElement.element,
          data: {
            ...connectedElement.data,
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

    return (
      <div className="flex flex-col">
        <h1 className="pt-2 text-xl">
          {loopar.utils.Capitalize(connectedElement.element)} Editor
        </h1>
        <Tabs
          data={{ name: "element_editor_tabs" }}
          key={connectedElement.identifier + "_tabs"}
        >
          {metaFields.map(({ group, elements }) => {
            return (
              <Tab
                label={loopar.utils.Capitalize(group)}
                name={group + "_tab"}
                key={group + "_tab"}
              >
                {
                  Object.entries(elements).map(([field, props]) => {
                    if (dontHaveMetaElements.includes(field)) return null;
                    if (!props.element) {
                      return props;
                    }

                    const value = data[field];
                    this.formValues[field] = value;

                    return (
                      <MetaComponent
                        component={props.element}
                        render={Component => (
                          <Component
                            key={connectedElement.identifier + "_" + field}
                            dontHaveForm={true}
                            data={{
                              ...props.data,
                              name: field,
                              value: value
                            }}
                            onChange={(e) => {
                              this.formValues[field] = e.target ? e.target.value : e;
                              this.saveData();
                            }}
                          />
                        )}
                      />
                    )
                  })
                }
              </Tab>
            )
          })}
        </Tabs>
      </div>
    );
  }

  saveData() {
    const data = this.getData();
    loopar.Designer.updateElement(data.key, data, false);
    setTimeout(() => {
      this.setState({ data: data});
    });
  }

  getData() {
    const data = this.formValues;
    data.key ??= this.connectedElement.identifier;

    return data;
  }

  get connectedElement() {
    return this.state.connectedElement;
  }

  editinImage(newData) {
    const currentData = this.connectedElement.data;

    return (currentData.background_image !== newData.background_image)
  }
}