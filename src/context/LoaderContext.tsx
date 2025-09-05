// context/LoaderContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoaderContextType {
  showLoader: (text?: string) => void;
  hideLoader: () => void;
  isLoading: boolean;
  loaderText: string;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const LoaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loaderText, setLoaderText] = useState('Loading...');

  const showLoader = (text: string = 'Loading...') => {
    setLoaderText(text);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
    setLoaderText('Loading...');
  };

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader, isLoading, loaderText }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="loader animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700">{loaderText}</p>
          </div>
        </div>
      )}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (context === undefined) {
    throw new Error('useLoader must be used within a LoaderProvider');
  }
  return context;
};