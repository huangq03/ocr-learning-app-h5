import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/', // Example of a directory to disallow
    },
    sitemap: 'https://ocr-learning-app.com/sitemap.xml', // Replace with your actual domain
  }
}
