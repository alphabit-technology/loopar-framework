import {
  FormLabel as BaseFormLabel,
} from "@cn/components/ui/form";

export function FormLabel({field, ...props }) {
  const data = props.data || {};
  return !props.dontHaveLabel && <BaseFormLabel className={field.isInvalid && "text-red-400"}>{data.label || field.name}</BaseFormLabel>
}