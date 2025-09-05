import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/', // Example of a directory to disallow
    },
          sitemap: `${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/profile/', '/share/'],
        },
      ],
    }; // Replace with your actual domain
  }
}
