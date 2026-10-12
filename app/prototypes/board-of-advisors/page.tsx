import type { Metadata } from "next";

import { BoardOfAdvisorsPrototype } from "@/prototypes/board-of-advisors/BoardOfAdvisorsPrototype";

export const metadata: Metadata = {
  title: "Board of Advisors — Prototype",
  robots: { index: false, follow: false },
};

export default function BoardOfAdvisorsPrototypePage() {
  return <BoardOfAdvisorsPrototype />;
}
