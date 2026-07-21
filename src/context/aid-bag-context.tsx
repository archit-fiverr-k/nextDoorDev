"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface AidBagItem {
  id: string;
  name: string;
  price: number;
  duration: number;
  pharmacySlug?: string;
  pharmacyName?: string;
  category?: string;
}

interface AidBagContextType {
  items: AidBagItem[];
  addItem: (item: AidBagItem) => void;
  removeItem: (id: string) => void;
  clearBag: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  totalPrice: number;
  totalDuration: number;
  itemCount: number;
}

const AidBagContext = createContext<AidBagContextType | undefined>(undefined);

export function AidBagProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<AidBagItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load saved Aid Bag items from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ndc_aid_bag_items");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load Aid Bag items", e);
    }
  }, []);

  // Save items to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem("ndc_aid_bag_items", JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save Aid Bag items", e);
    }
  }, [items]);

  const addItem = (item: AidBagItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) return prev;
      return [...prev, item];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearBag = () => {
    setItems([]);
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);
  const itemCount = items.length;

  return (
    <AidBagContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearBag,
        isOpen,
        setIsOpen,
        totalPrice,
        totalDuration,
        itemCount,
      }}
    >
      {children}
    </AidBagContext.Provider>
  );
}

export function useAidBag() {
  const context = useContext(AidBagContext);
  if (!context) {
    throw new Error("useAidBag must be used within an AidBagProvider");
  }
  return context;
}
