import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategorySection } from "@/components/CategorySection";
import { VehicleListings } from "@/components/VehicleListings";
import { Footer } from "@/components/Footer";

/* suppression anciens import 
import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from '@/components/Hero";
import { CategorySection } from '@/components/CategorySection";
import { VehicleListings } from '@/components/VehicleListings";
import { Footer } from '@/components/Footer";
*/


export default function HomePage() {
  const [currentView, setCurrentView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        currentView={currentView}
        setCurrentView={setCurrentView}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <main>
        <Hero />
        <CategorySection />
        <VehicleListings />
      </main>
      <Footer />
    </div>
  );
}