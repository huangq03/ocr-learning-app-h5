import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: {
    default: "OCR Learning App",
    template: `%s - OCR Learning App`,
  },
  description: "Learn languages by capturing text from images. Create study plans, practice with dictation and recitation, and track your progress.",
  keywords: ["OCR", "Language Learning", "Spaced Repetition", "Dictation", "Recitation", "Study App"],
  authors: [{ name: "OCR Learning App Team" }],
  creator: "OCR Learning App Team",
  publisher: "OCR Learning App Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ocr-learning-app.com", // Replace with your actual domain
    title: "OCR Learning App",
    description: "Learn languages by capturing text from images and creating interactive study sessions.",
    siteName: "OCR Learning App",
    images: [
      {
        url: "/placeholder-logo.png", // Replace with a proper OG image URL
        width: 1200,
        height: 630,
        alt: "OCR Learning App Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OCR Learning App",
    description: "Learn languages by capturing text from images and creating interactive study sessions.",
    images: ["/placeholder-logo.png"], // Replace with a proper OG image URL
    creator: "@yourtwitterhandle", // Replace with your Twitter handle
  },
  icons: {
    icon: "/placeholder-logo.svg",
    shortcut: "/placeholder-logo.svg",
    apple: "/placeholder-logo.svg",
  },
  manifest: "/site.webmanifest", // You would need to create this file
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
