import React, { createContext, useContext, useState } from 'react';
import "../Styles/notion.css";

type NotifyType = 'success' | 'error' | 'warning' | 'info';

interface Notify {
  message: string;
  type: NotifyType;
}

const NotificationContext = createContext<any>(null);

export const useNotify = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notify, setNotify] = useState<Notify | null>(null);

  const show = (message: string, type: NotifyType = 'info') => {
    setNotify({ message, type });
    setTimeout(() => setNotify(null), 3000);
  };

  return (
    <NotificationContext.Provider value={{
      success: (msg: string) => show(msg, 'success'),
      error: (msg: string) => show(msg, 'error'),
      warning: (msg: string) => show(msg, 'warning'),
      info: (msg: string) => show(msg, 'info')
    }}>
      {children}
      {notify && (
        <div className={`toast toast-${notify.type}`}>
          {notify.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
};
