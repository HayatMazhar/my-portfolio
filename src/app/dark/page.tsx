import About from "@/components/About";
import Certifications from "@/components/Certifications";
import CommandPalette from "@/components/CommandPalette";
import Contact from "@/components/Contact";
import EmailSignup from "@/components/EmailSignup";
import Experience from "@/components/Experience";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Lesson from "@/components/Lesson";
import McpStrip from "@/components/McpStrip";
import Navbar from "@/components/Navbar";
import Projects from "@/components/Projects";
import RagSection from "@/components/RagSection";
import Skills from "@/components/Skills";
import Testimonials from "@/components/Testimonials";
import Ticker from "@/components/Ticker";
import TrustStrip from "@/components/TrustStrip";
import Writing from "@/components/Writing";

// /dark is the legacy dark-theme showcase; keep it, but keep it out of search
// so it doesn't compete with the canonical "/" (also disallowed in robots.ts).
export const metadata = {
  title: "Mazhar Hayat — AI Solutions Architect (dark edition)",
  robots: { index: false, follow: true },
};

export default function DarkHome() {
  return (
    <>
      <CommandPalette />
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <TrustStrip />
        <About />
        <Lesson
          number="Lesson · 01"
          text="A demo is a hypothesis. Production is the only evidence."
        />
        <Projects />
        <Lesson
          number="Lesson · 02"
          text="The bottleneck is never the model — it's chunking, retrieval, and prompts."
        />
        <Skills />
        <Experience />
        <Certifications />
        <RagSection />
        <McpStrip />
        <Lesson
          number="Lesson · 03"
          text="Measure or it didn't happen. Latency, accuracy, cost — define them first."
        />
        <Testimonials />
        <Writing />
        <EmailSignup />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
