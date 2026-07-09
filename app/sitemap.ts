import { MetadataRoute } from 'next'

// Google only trusts <lastmod> when it tracks real content changes —
// bump these dates manually when the page meaningfully changes.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.unheardradio.io',
      lastModified: '2026-05-02',
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.unheardradio.io/privacy',
      lastModified: '2026-04-29',
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]
}
