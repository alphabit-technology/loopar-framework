import { Button } from "@cn/components/ui/button";
import {CheckCircle} from "lucide-react";
import { themes } from "@global/themes";
import { titleize } from "inflection";
import BaseInput from "@base-input";

const Selector = ({ color, twcolor, text, onSelect, active }) => {
  const handleClick = (e) => {
    e.preventDefault();
    onSelect({ target: { value: color } });
  }
  
  return (
    <Button
      variant="ghost"
      className={`w-full inline-flex items-center justify-start gap-2 ${active === color ? 'bg-primary/50 text-white' : 'text-primary'}`}
      onClick={handleClick}
    >
      <span className={`${twcolor} w-5 h-5 rounded-full`}>
        {active === color && <CheckCircle className="w-5 h-5 text-white" />}
      </span>
      {text}
    </Button>
  );
}

export function ThemeSelector({ onSelect, active }) {
  return (
    <div className="grid grid-flow-col grid-rows-4 gap-4 border border-border rounded-md p-4">
      {themes.map(theme => {
        return (
          <Selector
            color={theme.name}
            twcolor={theme.twcolor}
            text={titleize(theme.name)}
            onSelect={onSelect}
            key={theme.color}
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