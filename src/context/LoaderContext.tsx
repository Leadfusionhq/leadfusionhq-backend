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
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          {/* Modern dark loader card */}
          <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700/50 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm mx-4">
            {/* Animated loader with gradient */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-gray-600/30"></div>
              <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400 animate-spin"></div>
              {/* Inner glow effect */}
              <div className="absolute top-2 left-2 w-12 h-12 rounded-full bg-blue-500/10 animate-pulse"></div>
            </div>
            
            {/* Loading text with subtle animation */}
            <div className="text-center">
              <p className="text-gray-200 text-lg font-medium mb-2">{loaderText}</p>
              <div className="flex space-x-1 justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
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