"use client";

import React from 'react';
import { SocketProvider } from '@/context/SocketContext';

const SocketWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  );
};

export default SocketWrapper;