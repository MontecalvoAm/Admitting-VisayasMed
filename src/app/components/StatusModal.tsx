'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle, X, Loader2 } from 'lucide-react';

export type StatusType = 'success' | 'error' | 'confirm';

interface StatusModalProps {
  isOpen: boolean;
  type: StatusType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
  isLoading = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-100',
          btnColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
          iconBg: 'bg-emerald-100/50',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-12 h-12 text-rose-500" />,
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-100',
          btnColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
          iconBg: 'bg-rose-100/50',
        };
      case 'confirm':
      default:
        return {
          icon: <HelpCircle className="w-12 h-12 text-vmed-blue-light" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-100',
          btnColor: 'bg-vmed-blue-dark hover:bg-vmed-blue-light shadow-blue-200',
          iconBg: 'bg-blue-100/50',
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300"
      >
        {/* Decorative background elements */}
        <div className={`absolute top-0 left-0 w-full h-32 ${config.bgColor} opacity-50 -z-10`} />
        
        <div className="p-8 pt-10 text-center">
          {/* Icon Section */}
          <div className={`w-24 h-24 ${config.iconBg} rounded-[2rem] mx-auto mb-6 flex items-center justify-center border-4 border-white shadow-sm relative group overflow-hidden`}>
             <div className="absolute inset-0 bg-white/40 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />
             {config.icon}
          </div>

          {/* Text Content */}
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-3">
            {title}
          </h3>
          <p className="text-slate-500 font-medium leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Actions Footer */}
        <div className="p-6 pt-2 flex items-center justify-center gap-3 bg-white/50 border-t border-slate-50">
          {type === 'confirm' ? (
            <>
              <button 
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all border border-slate-200 active:scale-95 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-[1.5] px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${config.btnColor}`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  confirmText
                )}
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className={`w-full px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg active:scale-95 ${config.btnColor}`}
            >
              Close
            </button>
          )}
        </div>

        {/* Close Button (Top Right) */}
        {!isLoading && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default StatusModal;
