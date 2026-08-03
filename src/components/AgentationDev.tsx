"use client";

import dynamic from "next/dynamic";

const Agentation = dynamic(
  () => import("agentation").then((mod) => mod.Agentation),
  { ssr: false },
);

export function AgentationDev() {
  return <Agentation endpoint="http://localhost:4747" />;
}
