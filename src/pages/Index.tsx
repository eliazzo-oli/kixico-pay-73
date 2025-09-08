import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProcessFlow from "@/components/ProcessFlow";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialSection from "@/components/TestimonialSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <ProcessFlow />
      <FeaturesSection />
      <TestimonialSection />
      <Footer />
    </div>
  );
};

export default Index;
