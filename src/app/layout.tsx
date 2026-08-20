import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { Providers } from "@/components/Providers";
import "@/styles/design-system.css";

/* The whole type system is one family worked across its width axis, so wdth
   has to come down with the font. Without it every rule that sets
   font-variation-settings:"wdth" silently does nothing and the display type
   loses its character. */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://garthheckman.com"),
  title: {
    default: "Garth Heckman | Coach, Pastor, Author, Generational Strategist",
    template: "%s | Garth Heckman",
  },
  description:
    "Forty-two years in ministry, business and coaching. Speaking, coaching, Simply Church, Bridgeworks, and the WTFU book.",
  openGraph: { type: "website", siteName: "Garth Heckman", locale: "en_US" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
