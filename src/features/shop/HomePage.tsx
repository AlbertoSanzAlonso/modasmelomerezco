import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from "@/lib/api";


// Sub-components
import { HeroSection } from './components/HeroSection';
import { NewArrivalsSection } from './components/NewArrivalsSection';
import { FeaturedSection } from './components/FeaturedSection';
import { NewsletterSection } from './components/NewsletterSection';

const HomePage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { hash } = useLocation();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: async () => {
      const allProducts = await api.products.getAll();
      return allProducts.slice(0, 8);
    }
  });

  React.useEffect(() => {
    if (hash === '#novedades') {
      const element = document.getElementById('novedades');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [hash]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      await api.subscriptions.create({
        email,
        status: 'pending',
        confirmation_token: token
      });

      await api.mail.sendConfirmationEmail(email, token);
      
      setIsSubscribed(true);
      setEmail('');
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error al suscribirse. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-accent overflow-x-hidden">
      <HeroSection />
      
      <NewArrivalsSection 
        products={products} 
        isLoading={isLoading} 
      />

      <FeaturedSection />

      <NewsletterSection 
        email={email}
        setEmail={setEmail}
        isSubmitting={isSubmitting}
        isSubscribed={isSubscribed}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
};

export default HomePage;
