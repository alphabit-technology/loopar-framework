import Input from "@input";
import BaseInput from "@base-input";

export default function Password(props){
  return (
    <Input
      type="password"
      {...props}
    />
  );
}

Password.metaFields = () => {
  return [
    ...BaseInput.metaFields(),
    {
      group: "form",
      elements: {
        secret: {
          element: SELECT,
          data: {
            label: "Storage",
            options: "encrypt\nhash",
            description:
              "encrypt (default): reversible, for credentials the system must send out (SMTP, API keys, tokens). " +
              "hash: one-way, for login passwords that are only verified.",
          },
        },
      },
    },
  ]
}