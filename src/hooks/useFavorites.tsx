import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Favorite {
  id: string;
  product_url: string;
  product_title: string | null;
  product_image: string | null;
  added_at: string;
}

interface FavoritesContextType {
  favorites: Favorite[];
  loading: boolean;
  isFavorite: (productUrl: string) => boolean;
  addFavorite: (product: { URL?: string; LINK?: string; TITLE?: string; IMAGE_URL?: string }) => Promise<void>;
  removeFavorite: (productUrl: string) => Promise<void>;
  toggleFavorite: (product: { URL?: string; LINK?: string; TITLE?: string; IMAGE_URL?: string }) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch favorites when user logs in
  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = useCallback((productUrl: string) => {
    return favorites.some(fav => fav.product_url === productUrl);
  }, [favorites]);

  const addFavorite = async (product: { URL?: string; LINK?: string; TITLE?: string; IMAGE_URL?: string }) => {
    if (!user) return;
    
    const productUrl = product.URL || product.LINK;
    if (!productUrl) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          product_url: productUrl,
          product_title: product.TITLE || null,
          product_image: product.IMAGE_URL || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setFavorites(prev => [data, ...prev]);
      toast.success('Added to favorites');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.info('Already in favorites');
      } else {
        console.error('Error adding favorite:', error);
        toast.error('Failed to add to favorites');
      }
    }
  };

  const removeFavorite = async (productUrl: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_url', productUrl);

      if (error) throw error;
      
      setFavorites(prev => prev.filter(fav => fav.product_url !== productUrl));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  const toggleFavorite = async (product: { URL?: string; LINK?: string; TITLE?: string; IMAGE_URL?: string }) => {
    const productUrl = product.URL || product.LINK;
    if (!productUrl) return;

    if (isFavorite(productUrl)) {
      await removeFavorite(productUrl);
    } else {
      await addFavorite(product);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, loading, isFavorite, addFavorite, removeFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
