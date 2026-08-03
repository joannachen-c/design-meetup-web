import type { Metadata } from "next";
import DesignSystem from "@/DesignSystem";

export const metadata: Metadata = {
  title: "Design system — Design Meetup",
};

export default function DesignSystemPage() {
  return <DesignSystem />;
}
