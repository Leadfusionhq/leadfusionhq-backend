'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/redux/store';
import { NotificationProvider } from '@/context/NotificationContext';
import { ChatProvider } from '@/context/ChatContext';
import { SocketProvider } from '@/context/SocketContext';
import SessionMonitor from '@/components/auth/SessionMonitor';

const ClientComponent = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SessionMonitor />
        <NotificationProvider>
          <SocketProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </SocketProvider>
        </NotificationProvider>
      </PersistGate>
    </Provider>
  );
};

export default ClientComponent;