import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { OpenSource } from "@/components/landing/OpenSource";
import { Pricing } from "@/components/landing/Pricing";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <OpenSource />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
