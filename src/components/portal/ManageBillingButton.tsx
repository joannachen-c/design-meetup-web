import { Primary } from "@/components/Primary";

export function ManageBillingButton({
  label = "manage billing",
  flow,
}: {
  label?: string;
  flow?: "payment_method_update";
}) {
  return (
    <form action="/api/stripe/portal" method="post" className="grid shrink-0 justify-items-end">
      {flow ? <input type="hidden" name="flow" value={flow} /> : null}
      <Primary
        className="lowercase bg-gray-100! text-ink hover:bg-gray-200! disabled:hover:bg-gray-100!"
        variant="secondary"
        type="submit"
      >
        {label}
      </Primary>
    </form>
  );
}
