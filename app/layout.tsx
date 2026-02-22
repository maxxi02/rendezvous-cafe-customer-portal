import "./globals.css";
import type { Metadata } from "next";
import LenisProvider from "./providers/LenisProvider";

export const metadata: Metadata = {
  title: "Rendezvous Cafe",
  description:
    "Freshly brewed moments. Discover the taste of handcrafted coffee.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts: Anton (display) + Caveat (cursive accent) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@700&display=swap"
          rel="stylesheet"
        />

        {/* Material Icons */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}