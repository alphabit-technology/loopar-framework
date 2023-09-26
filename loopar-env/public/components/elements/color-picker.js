import { BaseInput } from "../base/base-input.js";
import { input, style, div } from "/components/elements.js";
import { elementManage } from "../element-manage.js";

export default class ColorPicker extends BaseInput {
   inputType = 'color';
   initialColor = {}
   constructor(props) {
      super(props);

      this.initialColor = this.getInitialColor();

      this.state = {
         ...this.state,
         color: this.initialColor.color,
         alpha: this.initialColor.alpha,
         identifier: elementManage.getUniqueKey()
      }
   }

   getInitialColor() {
      const value = this.data.value;

      if (value && typeof value === 'string' && elementManage.isJSON(value)) {
         return JSON.parse(value);
      } else if (value && typeof value === 'object') {
         return value;
      }

      return {
         color: '#000000',
         alpha: 0.5
      }
   }

   render() {
      const rgbaSection = (color, index) => {
         return parseInt(color.slice(index, index + 2), 16);
      }

      const key = 'c' + this.state.identifier;

      const color = this.state.color;

      const startLinealGradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 0)`; // #000000
      const endLinealGradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 1)`; // #ffffff
      const gradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 0.3)`; // #ffffff

      return super.render([
         style(`
            .${key} {
               display: flex;
               flex-direction: column;
               align-items: center;
               justify-content: center;
               width: 100%;
               height: 100px;
            }
            .${key} input[type="range"] {
                width: 100%;
                background: linear-gradient(to right, ${startLinealGradient} 0%, ${endLinealGradient} 100%);
                height: 20px;
                outline: none;
                -webkit-appearance: none;
                cursor: pointer;
              }
            
              .${key} input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                background: #fff;
                border-radius: 50%;
                border: 1px solid #ccc;
                box-shadow: 0 0 4px ${gradient};
                cursor: pointer;
                position: relative;
                z-index: 2;
              }
            
              .${key} input[type="range"]::-moz-range-thumb {
                width: 16px;
                height: 16px;
                background: #fff;
                border-radius: 50%;
                border: 1px solid #ccc;
                box-shadow: 0 0 4px ${gradient};
                cursor: pointer;
                position: relative;
                z-index: 2;
              }
            
              .${key} input[type="range"]::after {
                position: absolute;
                top: -20px;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 12px;
                color: #fff;
              }
         `),
         div({
            className: key + ' form-control'
         }, [
            input({
               type: "color",
               value: this.state.color,
               onChange: this.handleColorChange,
               ref: selector => this.selector = selector,
               style: {
                  position: "absolute",
                  left: 10,
                  pointerEvents: "none",
                  opacity: 0
               }
            }),
            div({
               style: { width: "100%", borderRadius: 10, border: "var(--singleBorder)", display: "inline-grid" }
            }, [
               div({
                  key: elementManage.getUniqueKey(),
                  style: {
                     position: "relative",
                     width: "100%",
                     height: 50,
                     backgroundColor: this.state.color,
                     opacity: this.state.alpha,
                     cursor: "pointer"
                  },
                  onClick: () => this.selector.node.click()
               }),
               input({
                  type: "range",
                  min: 0,
                  max: 1,
                  step: 0.01,
                  onChange: this.handleAlphaChange,
                  value: this.state.alpha,
               }),
            ]),
         ])
      ]);
   }

   componentDidMount() {
      super.componentDidMount();

      const value = this.data.value;

      if (value && typeof value === 'string' && elementManage.isJSON(value)) {
         const { color, alpha } = JSON.parse(value);
         this.setColor(color, alpha)
      }
   }

   handleColorChange = (e) => {
      this.setColor(e.target.value, this.state.alpha);
   }

   handleAlphaChange = (e) => {
      this.setColor(this.state.color, e.target.value);
   }

   setColor(color, alpha) {
      this.setState({ color, alpha });
      this.initialColor = { color, alpha };
   }

   val() {
      return {
         color: this.state.color,
         alpha: this.state.alpha
      }
   }

   getRgbaColor() {
      const color = this.state.color;
      const alpha = this.state.alpha;
      return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${alpha})`;
   }

   componentDidMount() {
      super.componentDidMount();
      this.input.addClass('select2-hidden-accessible');
   }
}