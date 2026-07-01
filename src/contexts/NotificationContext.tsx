import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLiveTable, useLiveDocument } from '../db/hooks';

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  status: 'active' | 'resolved';
  shopId: string;
}

interface NotificationContextType {
  alerts: StockAlert[];
  activeAlerts: StockAlert[];
  unreadCount: number;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  alerts: [],
  activeAlerts: [],
  unreadCount: 0,
  loading: true,
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { shopId, currentUser } = useAuth();
  const { documents: products, loading: productsLoading } = useLiveTable('products');
  const { document: settings, loading: settingsLoading } = useLiveDocument('settings', shopId);
  
  const loading = productsLoading || settingsLoading;
  
  const alerts: StockAlert[] = [];
  
  if (shopId && currentUser && !loading && settings) {
    const threshold = settings.lowStockThreshold || 5;
    
    products.forEach((p: any) => {
      if (p.stockQuantity <= threshold) {
        alerts.push({
          id: `alert-${p.id}`,
          productId: p.id,
          productName: p.name,
          currentStock: p.stockQuantity,
          minStockLevel: threshold,
          status: 'active',
          shopId: shopId
        });
      }
    });
  }

  return (
    <NotificationContext.Provider value={{ 
      alerts, 
      activeAlerts: alerts, 
      unreadCount: alerts.length, 
      loading 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
