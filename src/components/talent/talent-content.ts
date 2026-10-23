export type AdvisorCompany = {
  name: string;
  src: string;
  /** "tile" marks fill their square instead of sitting inset on white. */
  fit: "glyph" | "tile";
  /** Paints the square behind a tile mark so its edges disappear into it. */
  background?: string;
  /** Share of the square a glyph fills, for marks much wider than tall. */
  size?: string;
  /** Listed on the wall but left off the hero globe. */
  hiddenOnGlobe?: boolean;
};

// Where members of the Board of Advisors design today. Names stay private:
// the wall only ever shows the company.
export const advisorCompanies: AdvisorCompany[] = [
  { name: "OpenAI", src: "/talent/logos/openai.svg", fit: "glyph" },
  { name: "Google", src: "/partners/google.png", fit: "glyph" },
  { name: "Apple", src: "/partners/apple.png", fit: "glyph" },
  { name: "Meta", src: "/talent/logos/meta.svg", fit: "glyph" },
  { name: "Figma", src: "/partners/figma.png", fit: "glyph" },
  {
    name: "SpaceXAI",
    src: "/talent/logos/spacex.svg",
    fit: "glyph",
    size: "78%",
  },
  {
    name: "Instagram",
    src: "/talent/logos/instagram.svg",
    fit: "tile",
    hiddenOnGlobe: true,
  },
  {
    name: "Ramp",
    src: "/partners/partner-4.png",
    fit: "tile",
    background: "#e4f323",
  },
  { name: "Notion", src: "/partners/notion.png", fit: "glyph" },
  { name: "Adobe", src: "/talent/logos/adobe.svg", fit: "glyph" },
  { name: "Cognition", src: "/talent/logos/cognition.svg", fit: "glyph" },
  { name: "DoorDash", src: "/talent/logos/doordash.svg", fit: "glyph" },
  { name: "Google DeepMind", src: "/talent/logos/deepmind.svg", fit: "glyph" },
  { name: "Framer", src: "/partners/framer.png", fit: "glyph" },
  { name: "Clay", src: "/partners/partner-9.png", fit: "glyph" },
  { name: "fal", src: "/talent/logos/fal.png", fit: "tile" },
];


export const hubCities = [
  { code: "SF", name: "San Francisco" },
  { code: "LA", name: "Los Angeles" },
  { code: "NY", name: "New York" },
] as const;

export const seniorityLevels = [
  {
    level: "Designer",
    track: "IC",
  },
  {
    level: "Senior Designer",
    track: "IC",
  },
  {
    level: "Staff & Principal",
    track: "IC",
  },
  {
    level: "Design Engineering",
    track: "Hybrid",
  },
  {
    level: "Manager",
    track: "Leadership",
  },
  {
    level: "Head of Design",
    track: "Leadership",
  },
] as const;

export const networkFirstMonth = [
  { when: "Week 1", item: "Kickoff and role calibration" },
  { when: "Week 2", item: "First shortlist delivered" },
  { when: "Week 3", item: "Warm 1:1 intros begin" },
  { when: "Ongoing", item: "Rolling intros until the role closes" },
] as const;

export const dinnerRunOfShow = [
  { time: "6:00", item: "Doors open, mingling" },
  { time: "6:30", item: "Pre-matched 1:1 conversations" },
  { time: "7:00", item: "Dinner" },
  { time: "7:30", item: "Your product demo and open roles" },
  { time: "8:30", item: "Close" },
] as const;

export const processSteps = [
  {
    title: "Calibrate",
    body: "A 30-minute kickoff with your design team to pin down must-haves, portfolio signals and dealbreakers for each role.",
  },
  {
    title: "Source",
    body: "Designers apply with a portfolio and current status. We prioritize senior people who are active or open to a move.",
  },
  {
    title: "Shortlist",
    body: "You get vetted candidates per role, each with a one-line note on why they fit.",
    milestone: "5–8 per role",
  },
  {
    title: "Match",
    body: "You pick who to meet. We set up warm 1:1 intros, or seat them across from you at dinner.",
  },
  {
    title: "Follow through",
    body: "We track every intro to an outcome and refresh the pipeline until the role is filled.",
  },
] as const;
