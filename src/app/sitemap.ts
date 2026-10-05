import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://namipmu.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: {
          uk: "https://namipmu.com",
          ru: "https://namipmu.com",
          en: "https://namipmu.com",
          de: "https://namipmu.com",
        },
      },
    },
    {
      url: "https://namipmu.com/client-guide",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: {
          uk: "https://namipmu.com/client-guide",
          ru: "https://namipmu.com/client-guide",
          en: "https://namipmu.com/client-guide",
          de: "https://namipmu.com/client-guide",
        },
      },
    },
  ];
}
