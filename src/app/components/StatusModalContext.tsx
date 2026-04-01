'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import StatusModal, { StatusType } from './StatusModal';

interface StatusModalContextType {
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showConfirm: (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    confirmText?: string, 
    cancelText?: string
  ) => void;
  hideModal: () => void;
  setLoading: (isLoading: boolean) => void;
}

const StatusModalContext = createContext<StatusModalContextType | undefined>(undefined);

export const StatusModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<StatusType>('success');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [confirmText, setConfirmText] = useState('Confirm');
  const [cancelText, setCancelText] = useState('Cancel');
  const [isLoading, setIsLoading] = useState(false);
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | undefined>(undefined);

  const showSuccess = (t: string, m: string) => {
    setType('success');
    setTitle(t);
    setMessage(m);
    setIsOpen(true);
    setIsLoading(false);
  };

  const showError = (t: string, m: string) => {
    setType('error');
    setTitle(t);
    setMessage(m);
    setIsOpen(true);
    setIsLoading(false);
  };

  const showConfirm = (t: string, m: string, onConfirm: () => void, cText = 'Confirm', canText = 'Cancel') => {
    setType('confirm');
    setTitle(t);
    setMessage(m);
    setOnConfirmAction(() => onConfirm);
    setConfirmText(cText);
    setCancelText(canText);
    setIsOpen(true);
    setIsLoading(false);
  };

  const hideModal = () => {
    setIsOpen(false);
    setIsLoading(false);
  };

  const handleConfirm = () => {
    if (onConfirmAction) {
      onConfirmAction();
    }
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <StatusModalContext.Provider value={{ showSuccess, showError, showConfirm, hideModal, setLoading }}>
      {children}
      <StatusModal 
        isOpen={isOpen}
        type={type}
        title={title}
        message={message}
        onClose={hideModal}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        confirmText={confirmText}
        cancelText={cancelText}
      />
    </StatusModalContext.Provider>
  );
};

export const useStatusModal = () => {
  const context = useContext(StatusModalContext);
  if (context === undefined) {
    throw new Error('useStatusModal must be used within a StatusModalProvider');
  }
  return context;
};
