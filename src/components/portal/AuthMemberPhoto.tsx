export function AuthMemberPhoto() {
  return (
    <div className="hidden min-w-0 p-[clamp(16px,2vw,30px)] pr-[clamp(20px,6vw,96px)] pl-[clamp(16px,2vw,24px)] lg:flex">
      <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-[11px] bg-skeleton">
        <img
          src="/portal/member-photo.jpg"
          alt="Design Meetup members at a making workshop"
          className="absolute inset-0 size-full object-cover"
          width={1600}
          height={2000}
          decoding="async"
        />
      </div>
    </div>
  );
}
