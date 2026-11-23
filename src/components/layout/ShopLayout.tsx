import { type FC, type ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { RouteSeo } from '@/components/seo/RouteSeo';
import { GoogleCustomerReviewsBadge } from '@/features/shop/components/GoogleCustomerReviewsBadge';

interface ShopLayoutProps {
  children: ReactNode;
  setIsCartOpen: (open: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export const ShopLayout: FC<ShopLayoutProps> = ({ children, setIsCartOpen, isMenuOpen, setIsMenuOpen }) => {
  return (
    <div className="min-h-screen bg-accent text-secondary selection:bg-primary selection:text-white flex flex-col overflow-x-hidden">
      <RouteSeo />
      <GoogleCustomerReviewsBadge />
      <Navbar
        setIsCartOpen={setIsCartOpen} 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen} 
      />
      
      <main className="grow pt-20">
        {children}
      </main>

      <Footer />
    </div>
  );
};
