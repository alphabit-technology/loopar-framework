import {div,h5,button,span,i,label,input} from "/components/elements.js";
import {loopar} from "/loopar.js";
window.dialogsCount ??= 0;

export default class Dialog extends React.Component {
   constructor(props) {
      super(props);
      
      this.state = {
         type: props.type,
         title: props.title,
         content: props.children || props.content || props.message,
         buttons: props.buttons,
         open: (this.props.open !== "undefined" ? this.props.open : true),
         ok: props.ok,
         cancel: props.cancel,
         onClose: props.onClose,
         value: null
      };
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      if (prevProps.content !== this.props.content) {
         this.setState({
            content: this.props.content
         });
      }

      if(prevProps.open !== this.props.open){
         this.setState({
            open: this.props.open
         });
      }
   }

   get buttons(){
      const buttons = this.state.buttons || [];
      if(buttons.length === 0) {
         buttons.push({
            name: "ok",
            text: 'OK',
            onClick: () => {
               this.state.ok && this.state.ok(this.state.value);
               this.close();
            },
            dismiss: true
         });

         this.state.type === "confirm" &&
         buttons.push({
            name: "cancel",
            text: 'Cancel',
            onClick: () => {
               this.state.cancel && this.state.cancel();
               this.close();
            },
            dismiss: true
         });
      }else{
         const okButton = buttons.find(b => b.name === "ok");

         if(okButton){
            const okFunc = okButton.onClick;
            okButton.onClick = () => {
               okFunc && okFunc();
               this.state.ok && this.state.ok();
               this.close();
            };
            //okButton.dismiss = true;
         }

         const cancelButton = buttons.find(b => b.name === "cancel");

         if(cancelButton){
            const cancelFunc = cancelButton.onClick;
            cancelButton.onClick = () => {
               cancelFunc && cancelFunc();
               this.state.cancel && this.state.cancel();
               this.close();
            };
            //cancelButton.dismiss = true;
         }
      }

      return buttons;
   }

   getIcon(){
      const {type} = this.state;
      const icons = {
         info: 'fa-info-circle',
         alert: 'fa-exclamation-circle',
         confirm: 'fa-question-circle',
         error: 'fa-exclamation-triangle',
         success: 'fa-check-circle',
         prompt: 'fa-question-circle',
      };

      const icon = this.props.icon || 'fa ' + icons[type];

      const textColors = {
         info: 'text-blue',
         alert: 'text-dark',
         confirm: 'text-orange',
         error: 'text-red',
         success: 'text-green',
         prompt: 'text-blue',

      };

      return typeof icon === "string" ? i({className: `${icon} ${textColors[type]} mr-2`}) : icon;
   }

   render(body) {
      const {open, title, content=body, type="info", zIndex} = this.state;

      const hasFooter = this.props.hasFooter !== false;
      const contentType = typeof content === "string" ? "text" : "react";

      return [
         div({ 
            className: `modal-backdrop fade ${open ? 'show' : ''}`,
            style: { zIndex: zIndex, display: open ? 'block' : 'none'}
         }),
         div({
            className: `modal modal-${type} fade has-shown ${open ? 'show' : ''}`,
            style: {display: open ? 'block' : 'none', zIndex: zIndex, ...this.props.style || {}},
            onClick: (e) => {
               if(e.target === e.currentTarget){
                  this.close();
               }
            }
         },
            div({ 
               className: `modal-dialog modal-${this.props.size || "md"} modal-dialog-${this.props.position || 'centered'} ${this.props.scrollable ? 'modal-dialog-scrollable' : ''}`, 
               role: 'document'
            },
               div({className: 'modal-content'}, [
                  div({ className: `modal-header ${this.props.scrollable ? 'modal-body-scrolled' :''}`},[
                     h5({className: 'modal-title'}, [
                        this.getIcon(),
                        title
                     ]),
                     button({
                        type: 'button',
                        className: 'close',
                        onClick: () => this.close()
                     },
                        span({'aria-hidden': 'true'}, '×')
                     )
                  ]),
                  div({
                     className: 'modal-body',
                  }, [
                     contentType === "text" ? 
                        React.createElement("div", { dangerouslySetInnerHTML: { __html: `<p>${content}</p>` } }) :
                        div({}, content)
                  ]),
                  hasFooter ? div({className: 'modal-footer'}, this.buttons.map(b => {
                     return button({
                        type: 'button',
                        className: b.className || `btn btn-${b.type || 'primary'}`,
                        onClick: () => {
                           b.dismiss && this.close();
                           b.onClick();
                        },
                        ref: ref => {
                           if(ref){
                              this[`button_${b.name}`] = ref;
                           }
                        }
                     }, b.content || b.text || b.label);
                  })) : null
               ])
            )
         )
      ];
   }

   show(props) {
      window.dialogsCount++;
      this.setState({
         ...props, open: true,
         zIndex: this.state.zIndex || 10000 + window.dialogsCount
      }, () => {
         this.state.onShow && this.state.onShow();
      });
   }

   close() {
      this.setState({open: false}, () => {
         this.state.onClose && this.state.onClose();
      });
   }

   componentDidUpdate() {
      this.button_ok?.focus();
   }
}

class PropmtClass extends Dialog{
   constructor(props) {
      super(props);
   }

   render(){
      return super.render([
         div({className: "form-group"}, [
            label({htmlFor: "prompt-input"}, this.props.label || ""),
            input({
               type: "text", 
               className: "form-control", id: "prompt-input", 
               placeholder: this.props.placeholder || "",
               onChange: (e) => {
                  this.setState({
                     value: e.target.value
                  });
               }
            })
         ])
      ])
   }
}

export const _Prompt = (props) => {
   return React.createElement(PropmtClass, props);
}

export const Prompt = (props) => {
   loopar.prompt({ ...props});
}

export const Modal = (props, content) => {
   loopar.dialog({ ...props, content: props.content || content });
}

