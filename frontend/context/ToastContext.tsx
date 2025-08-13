import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from '@/components/Toast';

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<ToastType>('info');
  const [toastMessage, setToastMessage] = useState('');
  const [toastDuration, setToastDuration] = useState(3000);

  const showToast = (type: ToastType, message: string, duration = 3000) => {
    setToastType(type);
    setToastMessage(message);
    setToastDuration(duration);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={toastVisible}
        type={toastType}
        message={toastMessage}
        duration={toastDuration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
