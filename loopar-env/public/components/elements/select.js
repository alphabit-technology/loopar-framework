import {div, span, b, input, ul, li, h6, i} from "/components/elements.js";
import {http} from "/router/http.js";
import {BaseInput} from "/components/base/base-input.js";
import {loopar} from "/loopar.js";

export default class Select extends BaseInput {
   #model = null;
   filtered_options = [];
   opened = false;
   inside = false;
   position_setted = false;
   title_fields = ["value"]

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         is_open: false,
         direction: 'below',
         valid: true,
         simpleInput: props.simpleInput || false,
         withoutLabel: props.withoutLabel || false,
         rows: []
      };
   }

   render(){
      const data = this.data;

      this.assigned_value = data.value;
      const {is_open, direction, valid, focus, rows=[]} = this.state;
      const value = this.optionValue();

      const base_class = 'select2-container';
      const opened_class = is_open ? base_class + '--open' : '';
      const focus_class = focus ? base_class + '--focus' : '';

      return super.render([
         div({
            className: `select-2 select-${is_open ? 'opened' : 'closed'}`,
         }, [
            span({
               className: `select2 select2-${data.size} ${base_class} ${base_class}--default ${base_class}--${direction} ${focus_class} ${opened_class}`,
               style: {width: '100%'},
            }, [
               span({
                  className: 'selection',
                  ref: selection => this.selection = selection,
                  onClick: e => {
                     e.stopPropagation();
                     e.preventDefault();
                     this.focus();
                     this.toggleClose();
                  },
                  onMouseLeave: (e) => {
                     e.stopPropagation();
                     this.inside = false;
                  },
                  onMouseEnter: (e) => {
                     e.stopPropagation();
                     this.inside = true;
                  }
               },[
                  span({
                     className: `select2-selection select2-selection--single${this.state.is_invalid ? ' is-invalid' : ''}`,
                     role: 'combobox', 'aria-haspopup': true, 'aria-expanded': false, 'aria-disabled': false,
                     'aria-labelledby': 'select2-select2-data-remote-container',
                     //style: {maxHeight: 28, fonSize: 12}
                  },[
                     span({className: 'select2-selection__rendered', role: 'textbox', 'aria-readonly': true}, [
                        value.value || value.option ? [
                           span({className: 'select2-selection__clear', onClick:(e)=> {
                              e.stopPropagation();
                              e.preventDefault();
                              this.setOptionSelect(null);
                           }}, '×'),
                           div(value.value || value.option)
                        ]:
                        span({className: 'select2-selection__placeholder'}, data.label || 'Select an option'),
                     ]),
                     span({className: 'select2-selection__arrow', role: 'presentation'}, [
                        b({role: 'presentation'}),
                     ])
                  ])
               ]),
               span({className: 'dropdown-wrapper', 'aria-hidden': true}),
               span({
                  className: 'select2-container select2-container--default select2-container--open select-loaded',
                  style: {position: 'absolute', left: 0, width: '100%'},
                  onMouseLeave: () => {
                     this.inside = false;
                  }
               }, [
                  span({
                     ref: selector => this.selector = selector,
                     className: `select2-dropdown select2-dropdown--${direction} ${valid ? '' : 'is-invalid'}`,
                     style: {...{width: '100%', position: 'inherit'}, ...(direction === "above" ? {top: '-280px'} : {})},
                  }, [
                     span({className: 'select2-search select2-search--dropdown'},
                        input({
                           className: "select2-search__field" ,
                           ref: input_search => this.input_search = input_search,
                           placeholder: 'Enter 1 or more characters to search',
                           onKeyUp: e => {
                              e.stopPropagation();
                              e.preventDefault();
                              this.#search(true);
                           },
                           onChange: e => {
                              e.stopPropagation();
                              e.preventDefault();
                           },
                           onClick: (e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              this.inside = true;
                           }
                        })
                     ),
                     span({className: 'select2-results'},
                        ul({
                           className: 'select2-results__options',
                           style: direction === "above" ? {height: "200px"} : {}
                        }, [
                           rows.length > 0 ? rows.map(row => {
                              return li({
                                 className: 'select2-results__option select2-results__option--higlighted',
                                 role: "option", 'aria-selected': false,
                                 onClick: () => {
                                    this.setOptionSelect(row);
                                 }
                              }, [
                                 div({className: "media"}, [
                                    div({className: "media-body"}, [
                                       h6({className: "my-0"}, this.optionValue(row).value || this.optionValue(row).option),
                                       ul({className: "list-inline small text-muted"}, [
                                          li({className: "list-inline-item"}, [
                                             i({className: "fa fa-flash"}),
                                             this.optionValue(row).option
                                          ])
                                       ])
                                    ])
                                 ])
                              ])
                           }) : li({className: 'select2-results__option select2-results__message'}, 'No results found')
                        ])
                     )
                  ])
               ])
            ])
         ]),
      ]);
   }

   focus() {
      this.setState({focus: true});
   }

   blur() {
      this.setState({focus: false});
   }

   componentDidMount(){
      super.componentDidMount();

      this.input.addClass('select2-hidden-accessible');
      //this.label.addClass('control-label hide');

      if(this.state.simpleInput){
         this.input.hide();
         this.label.hide();
      }

      if(this.state.withoutLabel){
         this.label.addClass('select2-hidden-accessible');
      }
   }

   toggleClose() {
      this.state.is_open ? this.close() : this.open();
   }

   open() {
      this.position_setted = false;
      this.setState({is_open: true});

      this.#search(false);

      setCurrentSelect(this);
      this.setPosition();

      setTimeout(() => {
         this.input_search?.node?.focus();
      }, 20);
   }

   close() {
      this.setState({is_open: false});
   }

   #search(delay = true) {
      if (this.isLocal) {
         const q = this.searchQuery.toLowerCase();

         this.filtered_options = this.optionsSelect.filter(row => {
            return (typeof row == "object" ? (`${row.option} ${row.value}`) : row).toLowerCase().includes(q);
         }).map(row => {
            return typeof row == "object" ? row : {name: row, value: row}
         });

         this.renderResult();
      } else {
         this.#model = this.optionsSelect[0];
         if (delay){
            clearTimeout(this.last_search);
            this.last_search = setTimeout(() => {
               this.getServerData();
            }, 200);
         }else{
            this.getServerData();
         }
      }
   }

   get isLocal() {
      return this.optionsSelect.length > 1;
   }

   get model() {
      return (this.#model.option || this.#model.name);
   }

   get options(){

   }

   get optionsSelect() {
      const opts = (this.data.options || "");

      if(typeof opts == 'object'){
         if(Array.isArray(opts)){
            return opts;
         }else{
            return Object.keys(opts).map(key => ({option: key, value: opts[key]}));
         }
      }else if(typeof opts == 'string'){
         return opts.split(/\r?\n/).map(item => ({option: item, value: item}));
      }

      /*return typeof opts == 'object' && Array.isArray(opts) ? opts :
         opts.split(/\r?\n/).map(item => ({option: item, value: item}));*/
   }

   get searchQuery() {
     return this.input_search?.node?.value || "";
   }

   focus() {
      this.input_search?.node?.focus();
   }

   getServerData() {
      http.send({
         action: `/api/${this.model}/search`,
         params: {q: this.searchQuery},
         success: r => {
            this.title_fields = r.title_fields;
            this.filtered_options = r.rows;
            this.renderResult();
         },
         error: r => {
            console.log(r);
         },
         freeze: false
      });
   }

   renderResult() {
      this.setState({rows: this.filtered_options});
   }

   optionValue(option = this.currentSSelection) {
      const value = (data) => {
         if(data && typeof data == 'object') {
            if(Array.isArray(this.title_fields)) {
               const values = this.title_fields.map(item => data[item]);

               return values.reduce((a, b) => {
                  return [...a, [...a.map(item => item.toLowerCase())].includes(b.toLowerCase()) ? '' : b];
               }, []).join(" ");
            } else {
               return data[this.title_fields];
            }
         }
      }

      return option && typeof option == "object" ? {
         option: option.option || option.name,
         value: value(option),//option[this.title_fields] || option.value || option.option
      } : {option: option || this.assigned_value, value: option || this.assigned_value};
   }

   setOptionSelect(row) {
      this.close();
      this.assigned_value = row;
      this.renderValue();
   }

   renderValue(trigger_change = true) {
      const value = this.optionValue();
      this.handleInputChange({target: {value: value.option || value.value}});
   }

   /**
    *
    * @param {string || object} val
    * @param {boolean} trigger_change
    * @returns
    */
   val(val = null, {trigger_change = true} = {}) {
      if (val != null) {
         this.assigned_value = val;
         this.renderValue(trigger_change);
         return this;
      } else {
         return this.data.value
      }
   }

   get currentSSelection() {
      return Object.keys(this.filtered_options || {}) > 0 ?
         this.filtered_options.filter(item => this.optionValue(item).option === this.optionValue(this.assigned_value).option)[0]
         : this.assigned_value;
   }

   setPosition() {
      const getPosition = (el) => {
         let yPos = 0;

         while (el) {
            yPos += (el.offsetTop - el.scrollTop + el.clientTop);
            el = el.offsetParent;
         }

         return yPos;
      }

      const position = getPosition(this.node);
      const windowHalf = window.innerHeight / 2;

      this.setState({direction: position > windowHalf ? 'above' : 'below'});


      this.position_setted = true;
   }
}

const setCurrentSelect = (select) => {
   loopar.ui.current_select = select;
}

document.addEventListener('click', () => {
   const current_select = loopar.ui.current_select;

   setTimeout(() => {
      if(current_select && !current_select.inside){
         current_select.close();
         current_select.blur();
      }
   }, 0);
}, true);