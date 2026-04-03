import { BottomCta } from "@/components/landing/BottomCta";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { LogoStrip } from "@/components/landing/LogoStrip";
import { Navbar } from "@/components/landing/Navbar";
import { OpenSource } from "@/components/landing/OpenSource";
import { Pricing } from "@/components/landing/Pricing";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <LogoStrip />
        <Features />
        <OpenSource />
        <Pricing />
        <BottomCta />
      </main>
      <Footer />
    </>
  );
}
