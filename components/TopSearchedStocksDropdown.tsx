'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface SearchedStock {
  symbol: string;
  busquedas: number;
}

interface TopSearchedStocksDropdownProps {
  onStockClick?: (symbol: string) => void;
}

export default function TopSearchedStocksDropdown({ onStockClick }: TopSearchedStocksDropdownProps) {
  const [topStocks, setTopStocks] = useState<SearchedStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopSearchedStocks();
    
    // Suscripción en tiempo real para actualizaciones automáticas
    const subscription = supabase
      .channel('busquedas_acciones_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'busquedas_acciones'
        },
        () => {
          console.log('Cambio detectado en busquedas_acciones, actualizando...');
          fetchTopSearchedStocks();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchTopSearchedStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Log para ver todos los datos recibidos
      console.log('Fetching top searched stocks for dropdown...');
      
      const { data, error: supabaseError } = await supabase
        .from('busquedas_acciones')
        .select('symbol, busquedas')
        .order('busquedas', { ascending: false })
        .limit(10); // Aumentado de 5 a 10

      if (supabaseError) {
        throw supabaseError;
      }

      console.log('Dropdown - Datos recibidos:', data);
      console.log('Dropdown - Total de stocks:', data?.length || 0);
      
      setTopStocks(data || []);
    } catch (err) {
      console.error('Error fetching top searched stocks:', err);
      setError('Error al cargar las acciones más buscadas');
    } finally {
      setLoading(false);
    }
  };

  const handleStockClick = (symbol: string) => {
    if (onStockClick) {
      onStockClick(symbol);
    }
  };

  const handleRetry = () => {
    fetchTopSearchedStocks();
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="px-3 py-2 text-green-400 text-sm flex items-center space-x-2">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Cargando...</span>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="px-3 py-2">
        <div className="text-red-400 text-sm mb-2">{error}</div>
        <button
          onClick={handleRetry}
          className="text-green-400 hover:text-green-300 text-xs flex items-center space-x-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  // Estado sin datos
  if (topStocks.length === 0) {
    return (
      <div className="px-3 py-2 text-gray-400 text-sm">
        No hay datos disponibles
      </div>
    );
  }

  // Diseño horizontal original con scroll
  return (
    <>
      {topStocks.map((stock, index) => (
        <button
          key={stock.symbol}
          onClick={() => handleStockClick(stock.symbol)}
          className="px-3 py-1.5 text-green-400 hover:bg-green-400/10 cursor-pointer rounded-full border border-green-400/30 transition-colors duration-200 text-sm font-medium"
        >
          {stock.symbol}
        </button>
      ))}
    </>
  );
}