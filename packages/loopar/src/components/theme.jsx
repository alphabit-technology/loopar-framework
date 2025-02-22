import { Button } from "@cn/components/ui/button";
import {CircleIcon, CheckCircle} from "lucide-react";
import { themes, showColors } from "@global/themes";
import { titleize } from "inflection";
import BaseInput from "@base-input";

const Selector = ({ color, text, onSelect, active }) => {
  const handleClick = (e) => {
    e.preventDefault();
    onSelect({ target: { value: color } });
  }
  return (
    <Button
      variant="ghost"
      className="w-full inline-flex items-center justify-start gap-2"
      onClick={handleClick}
    >
      <span className={`${showColors[color]} w-5 h-5 rounded-full`}>
        {active === color && <CheckCircle className="w-5 h-5 text-white" />}
      </span>
      {text}
    </Button>
  );
}

export function ThemeSelector({ onSelect, active }) {
  return (
    <div className="grid grid-flow-col grid-rows-4 gap-4 border border-border rounded-md p-4">
      {Object.keys(themes).map((color) => {
        return (
          <Selector
            color={color}
            text={titleize(color)}
            onSelect={onSelect}
            key={color}
            active={active}
          />
        );
      })}
    </div>
  )
}

export default function ThemeCustomizer(props) {
  const { renderInput } = BaseInput(props);

  return renderInput(field => {
    return (
      <div className="w-full">
        <ThemeSelector onSelect={field.onChange} active={field.value}/>
      </div>
    )
  });
}