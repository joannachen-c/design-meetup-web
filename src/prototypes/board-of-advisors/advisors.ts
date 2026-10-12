export type Advisor = {
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  href: string;
};

export const advisors: Advisor[] = [
  { firstName: "Dieter", lastName: "Rams", title: "Former Chief Design Officer", company: "Braun", href: "#" },
  { firstName: "Jony", lastName: "Ive", title: "Design Partner", company: "LoveFrom", href: "#" },
  { firstName: "Margaret", lastName: "Calder", title: "VP of Design", company: "Figma", href: "#" },
  { firstName: "Karri", lastName: "Saarinen", title: "CEO & Co-founder", company: "Linear", href: "#" },
  { firstName: "Julie", lastName: "Zhuo", title: "Former VP of Design", company: "Meta", href: "#" },
  { firstName: "Bret", lastName: "Victor", title: "Founder", company: "Dynamicland", href: "#" },
  { firstName: "Susan", lastName: "Kare", title: "Iconographer", company: "Independent", href: "#" },
  { firstName: "Don", lastName: "Norman", title: "Director", company: "Design Lab UCSD", href: "#" },
  { firstName: "Irene", lastName: "Au", title: "Design Partner", company: "Khosla Ventures", href: "#" },
  { firstName: "John", lastName: "Maeda", title: "VP of Design & AI", company: "Microsoft", href: "#" },
  { firstName: "Kate", lastName: "Aronowitz", title: "Design Advisor", company: "Greylock", href: "#" },
  { firstName: "Frank", lastName: "Chimero", title: "Design Director", company: "Stripe", href: "#" },
  { firstName: "Tobias", lastName: "van Schneider", title: "Founder", company: "Semplice", href: "#" },
  { firstName: "Elizabeth", lastName: "Goodspeed", title: "Creative Director", company: "Google", href: "#" },
  { firstName: "Ryan", lastName: "Hamm", title: "Head of Design", company: "Notion", href: "#" },
  { firstName: "Linda", lastName: "Jiang", title: "Design Lead", company: "Apple", href: "#" },
  { firstName: "Marc", lastName: "Hedges", title: "VP of Product Design", company: "Airbnb", href: "#" },
  { firstName: "Soleio", lastName: "Bernstein", title: "Design Partner", company: "Collaborative Fund", href: "#" },
  { firstName: "Wilson", lastName: "Miner", title: "Head of Design", company: "Instagram", href: "#" },
  { firstName: "Nicole", lastName: "Fenton", title: "Content Design Lead", company: "Slack", href: "#" },
  { firstName: "Josh", lastName: "Brewer", title: "Former Design Lead", company: "Twitter", href: "#" },
  { firstName: "Cameron", lastName: "Moll", title: "Design Director", company: "Facebook", href: "#" },
  { firstName: "Jessica", lastName: "Hische", title: "Lettering Artist", company: "Independent", href: "#" },
  { firstName: "Aaron", lastName: "Draplin", title: "Founder", company: "DDC", href: "#" },
  { firstName: "Michael", lastName: "Bierut", title: "Partner", company: "Pentagram", href: "#" },
  { firstName: "Paula", lastName: "Scher", title: "Partner", company: "Pentagram", href: "#" },
  { firstName: "Stefan", lastName: "Sagmeister", title: "Founder", company: "Sagmeister & Walsh", href: "#" },
  { firstName: "Emily", lastName: "Oberman", title: "Partner", company: "Pentagram", href: "#" },
  { firstName: "Natasha", lastName: "Jen", title: "Partner", company: "Pentagram", href: "#" },
  { firstName: "Lucas", lastName: "Zanotto", title: "Creative Director", company: "Yat Labs", href: "#" },
  { firstName: "Raquel", lastName: "Breeden", title: "Design Director", company: "Spotify", href: "#" },
  { firstName: "Diane", lastName: "Von Furstenberg", title: "Fashion Designer", company: "DVF", href: "#" },
  { firstName: "Tim", lastName: "Van Damme", title: "Head of Design", company: "Gusto", href: "#" },
  { firstName: "Shaun", lastName: "Inman", title: "Design Engineer", company: "Independent", href: "#" },
  { firstName: "Rachel", lastName: "Inman", title: "UX Director", company: "Google", href: "#" },
  { firstName: "Andy", lastName: "Allen", title: "Founder", company: "Not Boring", href: "#" },
  { firstName: "Gabriel", lastName: "Valdivia", title: "Design Lead", company: "Meta", href: "#" },
  { firstName: "Lottie", lastName: "Bromley", title: "Head of Brand", company: "Ramp", href: "#" },
  { firstName: "Nicolas", lastName: "Dahan", title: "Design Director", company: "Shopify", href: "#" },
  { firstName: "Helen", lastName: "Tran", title: "Design Lead", company: "Adobe", href: "#" },
  { firstName: "Pablo", lastName: "Stanley", title: "Head of Design", company: "Bun", href: "#" },
  { firstName: "Molly", lastName: "Hellmuth", title: "Founder", company: "UI Prep", href: "#" },
  { firstName: "Brian", lastName: "Lovin", title: "Product Designer", company: "GitHub", href: "#" },
  { firstName: "Ryo", lastName: "Lu", title: "Head of Design", company: "Cursor", href: "#" },
  { firstName: "Diana", lastName: "Mounter", title: "Design Systems Lead", company: "GitHub", href: "#" },
  { firstName: "Kris", lastName: "Sowersby", title: "Type Designer", company: "Klim Type Foundry", href: "#" },
  { firstName: "Lauren", lastName: "Hom", title: "Lettering Artist", company: "Independent", href: "#" },
  { firstName: "Tobias", lastName: "Ahlin", title: "Design Lead", company: "Spotify", href: "#" },
  { firstName: "Vitaly", lastName: "Friedman", title: "Editor-in-Chief", company: "Smashing Magazine", href: "#" },
  { firstName: "Brad", lastName: "Frost", title: "Design Systems Advocate", company: "Independent", href: "#" },
];

export function advisorFullName(advisor: Advisor) {
  return `${advisor.firstName} ${advisor.lastName}`;
}

export function advisorInitials(advisor: Advisor) {
  return `${advisor.firstName[0]}${advisor.lastName[0]}`.toUpperCase();
}

const avatarPalette = [
  "bg-[#e8edf5]",
  "bg-[#f0ebe3]",
  "bg-[#e5f0ea]",
  "bg-[#f3e8ee]",
  "bg-[#ebe8f5]",
  "bg-surface-muted",
] as const;

export function advisorAvatarClass(advisor: Advisor) {
  const hash =
    advisor.firstName.charCodeAt(0) * 31 + advisor.lastName.charCodeAt(0);
  return avatarPalette[hash % avatarPalette.length];
}
