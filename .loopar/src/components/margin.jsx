import BaseInput from "@base-input";
import Select from "@select";

export default function MarinInput(props) {
  const { renderInput, data={ label: "Margin", name: "margin", value: ""} } = BaseInput(props);

  return renderInput(field => {    
    return (
      <Select
        data={{
          ...data,
          options: ['m-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-7', 'm-8', 'm-9'],
          description: "Defined as tailwind class"
        }}
        onChange={field.onChange}
      />
    )
  });
}

MarinInput.metaFields = () => {return BaseInput.metaFields()}