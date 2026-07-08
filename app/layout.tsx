import type { Metadata } from "next";
import { Geist, Geist_Mono, Urbanist } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { BRAND_COLOR_STORAGE_KEY, DEFAULT_BRAND_COLOR, isValidBrandColor } from '@/lib/theme/brandColor'
import BrandColorInitializer from '@/app/(admin)/components/BrandColorInitializer'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "realtyprov1- Property Management System",
  description: "Modern property listings management system for real estate professionals",
  icons: {
    icon: "/realtyprov1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Admin theme: inject before hydration to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('adminTheme');if(t==='dark')document.documentElement.setAttribute('data-admin-theme','dark');}catch(e){}try{var c=localStorage.getItem('${BRAND_COLOR_STORAGE_KEY}');var d='${DEFAULT_BRAND_COLOR}';if(c&&${isValidBrandColor(DEFAULT_BRAND_COLOR).toString()}){if(/^#[0-9a-f]{3,6}$/i.test(c)){document.documentElement.style.setProperty('--est-purple',c);document.documentElement.style.setProperty('--est-purple-h',c);}}else{document.documentElement.style.setProperty('--est-purple',d);document.documentElement.style.setProperty('--est-purple-h',d);}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${urbanist.variable} antialiased`}
      >
        <BrandColorInitializer />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
