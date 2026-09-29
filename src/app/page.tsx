import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import { ToolCards } from "@/components/tool-cards";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <Hero />
        <ToolCards />
      </main>
      <Footer />
    </>
  );
}
