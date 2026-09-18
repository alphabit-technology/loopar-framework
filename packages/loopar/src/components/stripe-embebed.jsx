import { useEffect } from "react";
import loopar from "loopar";

/** Stripe pricing table (embedded). Needs `pricing_table_id` and `publishable_key`. */
export default function StripeEmbebed({ data = {} }) {
  useEffect(() => {
    loopar.require("https://js.stripe.com/v3/pricing-table");
  }, []);

  return (
    <stripe-pricing-table
      pricing-table-id={data.pricing_table_id}
      publishable-key={data.publishable_key}
    />
  );
}

StripeEmbebed.metaFields = () => [
  {
    group: "custom",
    elements: {
      pricing_table_id: { element: INPUT },
      publishable_key: { element: INPUT },
    },
  },
];
