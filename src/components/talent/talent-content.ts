export type AdvisorCompany = {
  name: string;
  src: string;
  /** "tile" marks are app icons that already carry their own square. */
  fit: "glyph" | "tile";
};

// Where members of the Board of Advisors design today. Names stay private:
// the wall only ever shows the company.
export const advisorCompanies: AdvisorCompany[] = [
  { name: "Google", src: "/partners/google.png", fit: "glyph" },
  { name: "Figma", src: "/partners/figma.png", fit: "glyph" },
  { name: "Cursor", src: "/partners/cursor.png", fit: "glyph" },
  { name: "Instagram", src: "/talent/logos/instagram.svg", fit: "glyph" },
  { name: "Ramp", src: "/partners/partner-4.png", fit: "tile" },
  { name: "Notion", src: "/partners/notion.png", fit: "glyph" },
  { name: "Adobe", src: "/talent/logos/adobe.svg", fit: "glyph" },
  { name: "Cognition", src: "/talent/logos/cognition.svg", fit: "glyph" },
  { name: "DoorDash", src: "/talent/logos/doordash.svg", fit: "glyph" },
  { name: "Google DeepMind", src: "/talent/logos/deepmind.svg", fit: "glyph" },
  { name: "Framer", src: "/partners/framer.png", fit: "glyph" },
  { name: "fal", src: "/talent/logos/fal.png", fit: "tile" },
  { name: "Riffle", src: "/talent/logos/riffle.png", fit: "tile" },
  { name: "Wonder", src: "/talent/logos/wonder.png", fit: "glyph" },
  { name: "Rivet", src: "/talent/logos/rivet.png", fit: "tile" },
  { name: "Paradigm", src: "/talent/logos/paradigm.svg", fit: "tile" },
];

export const ADVISOR_COUNT = 43;

export const hubCities = [
  {
    code: "SF",
    name: "San Francisco",
    scene: "AI labs, dev tools and founding teams",
  },
  {
    code: "LA",
    name: "Los Angeles",
    scene: "Consumer apps, media and creative tools",
  },
  {
    code: "NYC",
    name: "New York",
    scene: "Fintech, AI-native products and studios",
  },
] as const;

export const headlineStats = [
  {
    value: String(ADVISOR_COUNT),
    label: "design leaders on our Board of Advisors",
  },
  {
    value: String(advisorCompanies.length),
    label: "companies where they design, from Google to Cursor",
  },
  {
    value: "$100B+",
    label: "combined valuation of the private startups on the wall",
    note: "Last announced rounds of Ramp, Cursor, Cognition, Notion, fal and Framer.",
  },
  {
    value: "10,000+",
    label: "people at Design Meetup events across NYC, LA and the Bay Area",
  },
] as const;

export const seniorityLevels = [
  {
    level: "Senior",
    positions: "Senior Product Designer · Senior Brand Designer",
    track: "IC",
  },
  {
    level: "Staff & Principal",
    positions: "Staff Product Designer · Principal Designer",
    track: "IC",
  },
  {
    level: "Design Engineering",
    positions: "Design Engineer · Creative Technologist",
    track: "Hybrid",
  },
  {
    level: "Lead & Manager",
    positions: "Design Lead · Design Manager",
    track: "Leadership",
  },
  {
    level: "Head of Design",
    positions: "Head of Design · Founding Designer",
    track: "Leadership",
  },
] as const;

export const candidateSignals = [
  "6+ years shipping product",
  "Technical, data-heavy or developer-facing products",
  "Fluent in AI tools, prototypes in code",
  "Builders of 0→1 surfaces and design systems",
  "Actively or quietly open to a move",
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

export const dinnerThemes = [
  {
    title: "Design at the Frontier",
    blurb: "Designing AI-native, technical products with no established patterns yet.",
  },
  {
    title: "Taste Isn’t Outsourced",
    blurb: "Craft and judgment in the age of AI tools, and how senior designers defend their choices.",
  },
  {
    title: "Users Surprised Us",
    blurb: "Each guest brings a design decision where real behavior beat what users said they wanted.",
  },
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
    body: "You get 5–8 vetted candidates per role, each with a one-line note on why they fit.",
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

// Illustrative only: no real candidate is described here.
export const sampleShortlist = [
  {
    role: "Staff Product Designer",
    years: 9,
    city: "New York",
    why: "Built the design system behind a developer-facing data product",
  },
  {
    role: "Senior Product Designer",
    years: 7,
    city: "SF → NYC",
    why: "Took an AI-native product from 0→1 and prototypes in code",
  },
  {
    role: "Design Engineer",
    years: 6,
    city: "New York",
    why: "React and motion; owns the seam between design and engineering",
  },
  {
    role: "Principal Designer",
    years: 12,
    city: "San Francisco",
    why: "Led design for technical, data-heavy enterprise tools",
  },
  {
    role: "Design Lead",
    years: 10,
    city: "New York",
    why: "Grew a team of six while staying hands-on in Figma",
  },
  {
    role: "Senior Product Designer",
    years: 8,
    city: "Los Angeles",
    why: "Consumer craft with a sharp eye for systems",
  },
] as const;
