import BaseText from "#base-text";

export default class Title extends BaseText {
   droppable = false;
   draggable = true
   constructor(props) {
      super(props);
   }

   render() {
      return super.render([
         <h1
            className={`display-${this.getSize()} enable-responsive-font-size mb-4 ${this.getAlign()}`} {...(this.props.designer ? { style: { maxHeight: "3em", overflow: "auto", display: "-webkit-box", "-webkit-line-clamp": 5, "-webkit-box-orient": "vertical", } } : {})}
         >
            {this.getText()}
         </h1>
      ]);
   }
}