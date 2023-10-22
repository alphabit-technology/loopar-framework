import { Element, hr, h5, br, div, Tabs, label } from "/components/elements.js";

import DivClass from "/components/elements/div.js";
import { loopar } from "/loopar.js";
import { elementManage } from "/components/element-manage.js";
import { Divider } from "/components/gui/divider.js";

export class ElementEditorClass extends DivClass {
   formFields = [];

   constructor(props) {
      super(props);

      this.state = {
         connectedElement: null,
         data: {}
      }
   }

   get dataElements() {
      return [...this.#dataElements(), ...(this.connectedElement || {}).dataElements || []];
   }

   #dataElements() {
      const previewProps = {}
      const animationDuration = this.state.data.aos_animation_duration || 2000;

      /*if (this.state.data.aos) {
         previewProps['data-aos'] = this.state.data.aos;
         previewProps['data-aos-duration'] = animationDuration;
         previewProps['data-aos-delay'] = this.state.data.aos_animation_delay;
         previewProps['data-aos-easing'] = this.state.data.aos_easing;
      }*/

      return [
         {
            group: 'form',
            elements: {
               //tag: {element: INPUT},
               label: { element: INPUT },
               name: { element: INPUT },
               description: { element: TEXTAREA },
               format: {
                  element: SELECT,
                  data: {
                     options: [
                        { option: 'data', value: 'Data' },
                        { option: 'text', value: 'Text' },
                        { option: 'email', value: 'Email' },
                        { option: 'decimal', value: 'Decimal' },
                        { option: 'percent', value: 'Percent' },
                        { option: 'currency', value: 'Currency' },
                        { option: 'int', value: 'Int' },
                        { option: 'long_int', value: 'Long Int' },
                        { option: 'password', value: 'Password' },
                        { option: 'read_only', value: 'Read Only' }
                     ],
                     selected: 'data'
                  }
               },
               size: {
                  element: SELECT,
                  data: {
                     options: [
                        { option: 'sm', value: 'Small' },
                        { option: 'md', value: 'Medium' },
                        { option: 'lg', value: 'Large' }
                     ],
                     selected: 'md'
                  }
               },
               type: {
                  element: SELECT,
                  data: {
                     options: [
                        { option: 'default', value: 'Default' },
                        { option: 'primary', value: 'Primary' },
                        { option: 'success', value: 'Success' },
                        { option: 'info', value: 'Info' },
                        { option: 'link', value: 'link' },
                     ],
                     selected: 'default'
                  }
               },
               action: { element: INPUT },
               options: { element: TEXTAREA },
               not_validate_type: { element: SWITCH },
               required: { element: SWITCH },
               unique: { element: SWITCH },
               set_only_time: { element: SWITCH },
               readonly: { element: SWITCH },
               in_list_view: { element: SWITCH },
               searchable: { element: SWITCH },
            }
         },
         {
            group: 'design',
            elements: {
               background_color: { element: COLOR_PICKER },
               background_image: {
                  element: IMAGE_INPUT,
                  height: 200,
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
               color_overlay: { element: COLOR_PICKER },
               //background_color: {element: COLOR_PICKER},

               class: { element: TEXTAREA },
               style: { element: TEXTAREA },
               hidden: { element: SWITCH },
               disabled: { element: SWITCH },
               collapsed: { element: SWITCH }
            }
         },
         {
            group: 'Animation',
            elements: {
               info: label({
                  style: { paddingTop: 10 },
                  className: "text-danger"
               }, "Animations allowed in Website Only"),
               animation: {
                  element: "select",
                  data: {
                     options: {
                        "fade-up": 'Fade Up',
                        "fade-down": 'Fade Down',
                        "fade-left": 'Fade Left',
                        "fade-right": 'Fade Right',
                        "fade-up-right": 'Fade Up Right',
                        "fade-up-left": 'Fade Up Left',
                        "fade-down-right": 'Fade Down Right',
                        "fade-down-left": 'Fade Down Left',
                        "flip-up": 'Flip Up',
                        "flip-down": 'Flip Down',
                        "flip-left": 'Flip Left',
                        "flip-right": 'Flip Right',
                        "slide-up": 'Slide Up',
                        "slide-down": 'Slide Down',
                        "slide-left": 'Slide Left',
                        "slide-right": 'Slide Right',
                        "zoom-in": 'Zoom In',
                        "zoom-in-up": 'Zoom In Up',
                        "zoom-in-down": 'Zoom In Down',
                        "zoom-in-left": 'Zoom In Left',
                        "zoom-in-right": 'Zoom In Right',
                        "zoom-out": 'Zoom Out',
                        "zoom-out-up": 'Zoom Out Up',
                        "zoom-out-down": 'Zoom Out Down',
                        "zoom-out-left": 'Zoom Out Left',
                        "zoom-out-right": 'Zoom Out Right',
                     }
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
      meta.id ??= elementManage.getUniqueKey();
      const data = meta.data || {};
      const DI = []//this.optionsDisabled(connectedElement.element); //disabled inputs

      const dataElements = this.dataElements.map(({ group, elements }) => {
         if(group === 'form') {
            elements['divider_default'] = Divider({
               style: {
                  marginTop: 10,
                  marginBottom: 0,
                  color: 'red'
               },
               label: ""
            });
            
            elements['default_value'] = {
               element: connectedElement.element,
               data: {
                  ...connectedElement.meta.data,
                  key: connectedElement.meta.id + "_default",
                  label: "Default",
                  name: "default_vaule",
                  hidden: 0
               }
            }
         }

         return { group, elements };
      });

      return super.render([
         h5({
            className: "pt-2",
            style: { position: "absolute", zIndex: 100 }
         }, loopar.utils.Capitalize(connectedElement.element) + " Editor"),
         Tabs({
            className: "nav nav-tabs",
            meta: {
               data: { name: "element_editor_tabs" }
            },
            headerStyle: { paddingLeft: 0 },
            bodyStyle: { padding: 0 },
            style: { top: 25, width: "100%" },
         }, [
            ...dataElements.map(({ group, elements }) => {
               return {
                  data: { label: loopar.utils.Capitalize(group), name: group + "_tab" },
                  content: [
                     Object.entries(elements).map(([field, props]) => {
                        if (!props.element) {
                           return props;
                        }
                        const hide = DI.length > 0 && DI.includes(field) && DI[0] !== 'all' || (DI[0] === 'all' && !DI.includes(field));
                        return hide ? null : Element(props.element, {
                           key: meta.id + "_" + field,
                           style: props.style || {},
                           ref: self => this.formFields[field] = self,
                           meta: {
                              data: Object.assign({}, props.data || {}, {
                                 name: field,
                                 value: data[field] || '',
                                 test_field: 'test'
                              }),
                           },
                           onChange: () => {
                              this.saveData();
                           }
                        })
                     })
                  ]
               }
            }),
         ]),
         /*...Object.entries(this.dataElements).map(([field, props]) => {
               const hide = DI.length > 0 && DI.includes(field) && DI[0] !== 'all' || (DI[0] === 'all' && !DI.includes(field));
               return hide ? null : Element(props.element, {
                  ref: self => this.formFields[field] = self,
                  meta: {
                     data: Object.assign({}, props.data || {}, {name: field, value: data[field] || '', test_field: 'test'}),
                  },
                  onChange: () => {
                     this.saveData();
                  }
               });
         }).filter(e => e !== null),*/
         hr()
      ]);
   }

   componentDidUpdate() {
      super.componentDidUpdate();
      Object.entries(this.formFields).forEach(([fieldName, field]) => {
         field && field.removeClass("form-group").addClass("my-1");
      });
   }

   getData() {
      return Object.entries(this.formFields).reduce((acc, [key, field]) => {
         acc[key] = (field && field.isWritable) ? (field.mappedFiles || field.val()) : null;
         return acc;
      }, {});
   }

   editElement(element) {
      this.setState({ connectedElement: element });
   }

   get connectedElement() {
      return this.state.connectedElement;
   }

   saveData() {
      setTimeout(() => {
         const data = this.getData();

         if (loopar.Designer.updateElement(this.connectedElement.meta.data.name, data, false)) {
            this.state.connectedElement.meta.data = data;
         }

         this.setState({ data });
      }, 100);
   }

   optionsDisabled(element) {
      /**
       * Describe which inputs are disabled for each element
       */
      //const inputs = ['droppable', 'collapsed', 'type', 'action', 'options', 'background_image', 'background_color', 'accept', 'multiple']
      const inputType_format = 'droppable,collapsed,type,action,options,accept,multiple,background_image,background_size,background_color,color_overlay,animation,animation_duration,animation,animation_delay'.split(',');
      const inputs_type_element = [...inputType_format, 'format', 'action', 'size', 'options'];
      const html = 'required,in_list_view,collapsed,label,description,format,datatype,options,type,size,action,no_validate_type,unique,accept,multiple,size,in_list_view,required,unique,not_validate_type,readonly,searchable,set_only_time'.split(',');
      const button = html.concat(inputType_format).filter(item => !['label', 'size', 'type', 'action'].includes(item));
      const markdown = ['all', 'style', 'class'];
      const file_input = [...inputs_type_element, ...'in_list_view,required,unique,not_validate_type,readonly,searchable,set_only_time,description'.split(',')];

      return {
         [INPUT]: inputType_format,
         [TEXTAREA]: inputType_format,
         [PASSWORD]: inputType_format,
         [DATE]: inputs_type_element,
         [DATE_TIME]: inputs_type_element,
         [TIME]: inputs_type_element,
         [CHECKBOX]: inputs_type_element,
         [SWITCH]: inputs_type_element,
         [SELECT]: inputs_type_element.filter(field => !['options'].includes(field)),
         [FILE_INPUT]: file_input,
         [IMAGE_INPUT]: file_input,
         //[TABLE]: inputs_type_element,
         [FORM_TABLE]: [...inputs_type_element.filter(field => !['options'].includes(field)), ...'in_list_view,required,unique,not_validate_type,readonly,searchable,set_only_time'.split(',')],
         [COL]: html.filter(field => !['size'].includes(field)),
         [ROW]: html,
         [CARD]: html.filter(field => !['collapsed', 'label'].includes(field)),
         [BUTTON]: button,
         [MARKDOWN]: markdown,

      }[element.split('.')[0]] || [];
   }
}

export const ElementEditor = (props, content) => {
   return React.createElement(ElementEditorClass, props, content);
}