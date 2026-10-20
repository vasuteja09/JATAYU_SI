import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { DepartmentCards } from '../components/landing/DepartmentCards';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { LandingFooter } from '../components/landing/LandingFooter';

export const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-white font-sans">
    <LandingNavbar />
    <HeroSection />
    <HowItWorksSection />
    <FeaturesSection />
    <DepartmentCards />
    <LandingFooter />
  </div>
);
