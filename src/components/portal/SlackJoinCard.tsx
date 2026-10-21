import { Primary } from "@/components/Primary";
import { ArrowUpRightIcon } from "@/components/icons/ArrowUpRightIcon";
import { SlackIcon } from "@/components/portal/SocialIcons";

const SLACK_INVITE_URL =
  "https://join.slack.com/t/design-meetup/shared_invite/zt-4c8de7npx-a4QrnbTY_wCCWNpVlDSmPQ";
const SLACK_WORKSPACE_URL = "https://design-meetup.slack.com/";

export function SlackJoinCard({ joined = false }: { joined?: boolean }) {
  return (
    <section className="flex flex-col items-start gap-6 rounded-[20px] bg-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-white shadow-sm"
          aria-hidden
        >
          <SlackIcon className="size-7" />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-base font-bold text-ink">
            {joined ? "You're in the Slack" : "Join us on Slack"}
          </p>
          <p className="m-0 mt-1 text-pretty text-base text-subtle normal-case">
            {joined
              ? "Jump back in and catch up with other designers."
              : "Say hi and connect with other designers in the community."}
          </p>
        </div>
      </div>
      <Primary
        href={joined ? SLACK_WORKSPACE_URL : SLACK_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        variant="ink"
        className="self-end gap-1.5 px-5 sm:self-auto"
      >
        Open Slack
        <ArrowUpRightIcon />
      </Primary>
    </section>
  );
}
