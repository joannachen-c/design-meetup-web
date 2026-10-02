import HomePage from "@/components/HomePage";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { loadHomePageData } from "@/lib/home-page-data";
import { BoardOfAdvisorsSection } from "@/prototypes/board-of-advisors/BoardOfAdvisorsPrototype";

export const revalidate = 300;

export default async function Page() {
  const { advisors, ...homePage } = await loadHomePageData();

  return (
    <>
      <SiteJsonLd />
      <HomePage
        {...homePage}
        advisorsSection={
          <BoardOfAdvisorsSection advisors={advisors.advisors} source={advisors.source} />
        }
      />
    </>
  );
}
