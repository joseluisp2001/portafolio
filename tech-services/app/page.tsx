import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Marquee } from '@/components/Marquee';
import { Services } from '@/components/Services';
import { About } from '@/components/About';
import { Gallery } from '@/components/Gallery';
import { HowItWorks } from '@/components/HowItWorks';
import { BookingForm } from '@/components/BookingForm';
import { LocationHours } from '@/components/LocationHours';
import { Faq } from '@/components/Faq';
import { QuickLinks } from '@/components/QuickLinks';
import { Footer } from '@/components/Footer';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { AnimarAlVer } from '@/components/AnimarAlVer';

export default function HomePage() {
  return (
    <>
      <Header />

      {/* data-placa: fondo de placa madre (app/globals.css, lib/placa.ts) */}
      <main data-placa>
        <Hero />
        <Marquee />
        <Services />
        <About />
        <Gallery />
        <HowItWorks />
        <BookingForm />
        <LocationHours />
        <Faq />
        <QuickLinks />
      </main>

      <Footer />
      <WhatsAppFab />
      <AnimarAlVer />
    </>
  );
}
