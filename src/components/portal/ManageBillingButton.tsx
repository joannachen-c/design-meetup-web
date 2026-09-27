import { Primary } from "@/components/Primary";

export function ManageBillingButton() {
  return (
    <form action="/api/stripe/portal" method="post" className="grid shrink-0 justify-items-end">
      <Primary
        className="lowercase bg-gray-100! text-ink hover:bg-gray-200! disabled:hover:bg-gray-100!"
        variant="secondary"
        type="submit"
      >
        manage billing
      </Primary>
    </form>
  );
}
