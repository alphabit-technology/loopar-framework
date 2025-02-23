import BaseInput from "@base-input";
import elementManage from "@@tools/element-manage";
import { XIcon } from "lucide-react";
import { useRef, useState, useEffect } from "react";

import {
  FormControl,
  FormDescription,
  FormLabel,
} from "@cn/components/ui/form";

export default function ColorPicker(props) {
  const { renderInput, data, value } = BaseInput(props);
  const selector = useRef(null);

  const getColor = (value) => {
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

  const [color, setColor] = useState(getColor(data.value));

  const handleOpenColorPicker = (e) => {
    e.preventDefault();
    e.stopPropagation()
    selector.current.click();
  }

  useEffect(() => {
    setColor(getColor(value()));
    //setSelected(currentValue());
  }, [value()]);

  return renderInput((field) => {
    const rgbaSection = (color = "", index = 1) => parseInt(color.color.slice(index, index + 2), 16);
    //const { color, alpha } = getColor(field.value);

    const startLinearGradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 0)`; // #000000
    const endLinearGradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 1)`; // #ffffff
    const gradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 0.3)`; // #ffffff
      
    const handleColorChange = (color, alpha) => {
      setColor({ color, alpha });
      field.onChange(color ? JSON.stringify({ color, alpha }) : "");
    }

    const key = `c${color.color}${color.alpha}`.replaceAll("#", "").replaceAll(".", "");

    return (
      <div className="flex flex-col w-full">
        <FormLabel className="pb-3">
          {data.label}
        </FormLabel>
        <FormControl>
          <div>
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
                value={color.color}
                onChange={(e) => handleColorChange(e.target.value, color.alpha)}
                ref={selector}
                className="w-0 h-0 overflow-hidden pointer-events-none opacity-0"
              />
              <div
                className="w-full rounded-md border border-border shadow-sm inline-grid"
              >
                <div
                  onClick={handleOpenColorPicker}
                  style={{
                    backgroundColor: color.color,
                    opacity: color.alpha
                  }}
                  className="relative w-full h-20 cursor-pointer rounded-t-md"
                />
                <div className="flex justify-between items-center">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(e) => handleColorChange(color.color, e.target.value)}
                    value={color.alpha}
                    style={{ height: "30px" }}
                    className="rounded-bl-sm w-full h-[30px] outline-none cursor-pointer"
                  />
                  <a
                    style={{ backgroundColor: endLinearGradient }}
                    className="cursor-pointer rounded-br-sm h-full w-8 flex items-center justify-center text-white"
                    onClick={() => { handleColorChange("", 1) }}
                  >
                    <XIcon />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </FormControl>
        {data.description && <FormDescription>{data.description}</FormDescription>}
      </div>
    );
  }, "flex flex-row gap-2");
}