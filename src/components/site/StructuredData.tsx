export function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": "Blissful Place Residences",
    "description": "Three professionally managed short-let apartments in a secure gated compound in Agbado, Lagos. Full solar power, fiber internet, and direct booking.",
    "url": "https://www.blissfulplaceresidences.com",
    "telephone": "+2349013673587",
    "email": "reservations@blissfulplaceresidences.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "16 Tebun Fagbemi Street",
      "addressLocality": "Agbado",
      "addressRegion": "Lagos",
      "addressCountry": "NG"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 6.677627599999997,
      "longitude": 3.279664971163975
    },
    "priceRange": "₦120,000/night",
    "currenciesAccepted": "NGN",
    "paymentAccepted": "Credit Card, Bank Transfer, POS",
    "numberOfRooms": 3,
    "amenityFeature": [
      { "@type": "LocationFeatureSpecification", "name": "Solar Power", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Fiber Internet", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Secure Parking", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Gated Security", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Air Conditioning", "value": true }
    ],
    "areaServed": [
      { "@type": "City", "name": "Lagos" },
      { "@type": "Place", "name": "Agbado, Lagos" },
      { "@type": "Place", "name": "Ikeja, Lagos" },
      { "@type": "Place", "name": "Abule Egba, Lagos" },
      { "@type": "Place", "name": "Meiran, Lagos" },
      { "@type": "Place", "name": "Egbeda, Lagos" }
    ],
    "checkinTime": "13:00",
    "checkoutTime": "12:00"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
