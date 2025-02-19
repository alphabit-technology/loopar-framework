import * as RadioGroup from "@radix-ui/react-radio-group";


export default function RadioItem(props) {
  return (
    <div className="flex items-center">
      <RadioGroup.Item
        className="size-[25px] cursor-default rounded-full shadow-[0_2px_10px] shadow-blackA4 outline-none hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-slate-300"
        value="default"
        id="r1"
      >
        <RadioGroup.Indicator className="relative flex size-full items-center justify-center after:block after:size-[11px] after:rounded-full after:bg-violet11" />
      </RadioGroup.Item>
      <label
        className="pl-[15px] text-[15px] leading-none"
        htmlFor="r1"
      >
        {props.label}
      </label>
    </div>
  )
}
