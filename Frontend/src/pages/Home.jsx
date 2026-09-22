import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ExploreSection from '../components/ExploreSection';
import ThankYouSection from '../components/ThankYouSection';
import ReviewSection from '../components/ReviewSection';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col">
        <HeroSection />
        <ExploreSection />
        <ThankYouSection />
        <ReviewSection targetId="general" targetType="site" />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
