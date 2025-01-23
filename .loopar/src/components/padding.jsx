import BaseInput from "@base-input";
import Select from "@select";

export default function PaddingInput(props) {
  const { renderInput, data={ label: "Padding", name: "padding", value: ""} } = BaseInput(props);

  return renderInput(field => {    
    return (
      <Select
        data={{
          ...data,
          options: ['p-0','p-1','p-2','p-3','p-4','p-5','p-6','p-7','p-8','p-9'],
          description: "Defined as tailwind class"
        }}
        onChange={field.onChange}
      />
    )
  });
}

PaddingInput.metaFields = () => {return BaseInput.metaFields()}