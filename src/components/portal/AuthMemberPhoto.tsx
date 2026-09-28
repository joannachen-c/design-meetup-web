export function AuthMemberPhoto() {
  return (
    <div className="min-w-0 px-[clamp(20px,6vw,96px)] pb-12 lg:flex lg:p-[clamp(16px,2vw,30px)] lg:pr-[clamp(20px,6vw,96px)] lg:pl-[clamp(16px,2vw,24px)]">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] bg-skeleton sm:aspect-[5/4] lg:aspect-auto lg:min-h-[320px] lg:flex-1 lg:rounded-[11px]">
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
