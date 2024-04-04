import { jsx } from "react/jsx-runtime";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { f as Form, a as FormControl } from "./form-z4zN6fsS.js";
const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters."
  })
});
function FormWrapper(props = {}) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: ""
    }
  });
  function onSubmit(values) {
    console.log(values);
  }
  return /* @__PURE__ */ jsx(Form, { ...form, children: /* @__PURE__ */ jsx("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-8", children: props.children }) });
}
FormWrapper.prototype.FormControl = FormControl;
export {
  FormWrapper as F
};
