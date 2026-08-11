import {
  siteDescription,
  siteEmail,
  siteName,
  siteSameAs,
  siteUrl,
} from "@/lib/site";

export function SiteJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/design-meetup-logo.png`,
    email: siteEmail,
    description: siteDescription,
    areaServed: [
      { "@type": "City", name: "New York" },
      { "@type": "City", name: "San Francisco" },
      { "@type": "City", name: "Los Angeles" },
    ],
    sameAs: [...siteSameAs],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: siteDescription,
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
