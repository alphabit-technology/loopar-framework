import BaseInput from "$base-input";
import elementManage from "$tools/element-manage";
import { XIcon } from "lucide-react";

import {
  FormControl,
  FormDescription,
  FormLabel,
} from "@/components/ui/form";

export default class ColorPicker extends BaseInput {
  initialColor = {}

  getColor(value) {
    if (value && typeof value === 'string' && elementManage.isJSON(value)) {
      return JSON.parse(value);
    } else if (value && typeof value === 'object') {
      return value;
    }

    return {
      color: '',
      alpha: 0.5
    };
  }

  render() {
    const handleOpenColorPicker = (e) => {
      e.preventDefault();
      e.stopPropagation()
      this.selector.click();
    }
    const data = this.data;

    return this.renderInput((field) => {
      const rgbaSection = (color, index) => parseInt(color.slice(index, index + 2), 16);
      const { color, alpha } = this.getColor(field.value);

      const startLinearGradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 0)`; // #000000
      const endLinearGradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 1)`; // #ffffff
      const gradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 0.3)`; // #ffffff
      
      const handleColorChange = (color, alpha) => {
        field.onChange(color ? JSON.stringify({ color, alpha }) : "");
      }

      const key = `c${color}${alpha}`.replaceAll("#", "").replaceAll(".", "");

      return (
        <div className="flex flex-col w-full">
          <FormLabel className="pb-3">
            {data.label}
          </FormLabel>
          <FormControl>
            <>
              <style>{`
                .${key} input[type="range"]::-webkit-slider-thumb,
                .${key} input[type="range"]::-moz-range-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 16px; height: 16px;
                  background: #fff;
                  border-radius: 50%; border: 1px solid #ccc;
                  box-shadow: 0 0 4px ${gradient};
                  cursor: pointer;
                  position: relative;
                  z-index: 2;
                }
                .${key} input[type="range"]::after {
                  position: absolute;
                  top: -20px; left: 0; right: 0;
                  text-align: center; font-size: 12px;
                  color: #fff;
                }
                .${key} input[type="range"] {
                  background: linear-gradient(to right, ${startLinearGradient} 0%, ${endLinearGradient} 100%);
                  -webkit-appearance: none;
                }
              `}
              </style>
              <div className={`${key} flex flex-col align-items-center justify-center w-full h-[100px]`}>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value, alpha)}
                  ref={(selector) => (this.selector = selector)}
                  className="w-0 h-0 overflow-hidden pointer-events-none opacity-0"
                />
                <div 
                  className="w-full rounded-md border border-border shadow-sm inline-grid"
                >
                  <div
                    onClick={handleOpenColorPicker}
                    style={{
                      backgroundColor: color,
                      opacity: alpha
                    }}
                    className="relative w-full h-20 cursor-pointer rounded-t-md"
                  />
                  <div className="flex justify-between items-center">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(e) => handleColorChange(color, e.target.value)}
                      value={alpha}
                      style={{height: "30px"}}
                      className="rounded-bl-sm w-full h-[30px] outline-none cursor-pointer"
                    />
                    <a
                      style={{backgroundColor: endLinearGradient}}
                      className="cursor-pointer rounded-br-sm h-full w-8 flex items-center justify-center text-white"
                      onClick={() =>{handleColorChange("", 1)}}
                    >
                      <XIcon />
                    </a>
                  </div>
                </div>
              </div>
            </>
          </FormControl>
          {data.description && <FormDescription>{data.description}</FormDescription>}
        </div>
      );
    }, "flex flex-row gap-2");
  }

  /*componentDidMount() {
    super.componentDidMount();

    const value = this.data.value;

    if (value && typeof value === 'string' && elementManage.isJSON(value)) {
      const { color, alpha } = JSON.parse(value);
      this.setColor(color, alpha)
    }
  }*/

  /*handleColorChange = (e) => {
    const color = this.getColor();
    this.setColor(e.target.value, color.alpha);
  }*/

  /*handleAlphaChange = (e) => {
    const color = this.getColor();
    this.setColor(color.color, e.target.value);
  }*/

  /*setColor(color, alpha) {
    this.set("value", JSON.stringify({ color, alpha }), false);
  }*/

  /*resetColor() {
    this.setColor("", 1);
  }*/

  val() {
    const color = this.getColor();
    return {
      color: color.color,
      alpha: color.alpha
    }
  }
}