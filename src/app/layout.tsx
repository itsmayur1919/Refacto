import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata = {
  title: "Generative AI Refacto | Turn Documents into Traceable Requirements & Test Cases",
  description:
    "Enterprise AI platform that transforms specs, PDFs, and screenshots into fully linked Use Cases, Requirements, and Test Cases.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased selection:bg-accent/20 selection:text-accent">
        {children}
      </body>
    </html>
  );
}

