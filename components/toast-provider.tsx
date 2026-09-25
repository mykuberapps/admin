"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 bg-white border shadow-sm rounded-md min-w-[320px] max-w-md transition-all ${
              toast.type === 'success' ? 'border-l-4 border-l-green-500 border-gray-200' :
              toast.type === 'error' ? 'border-l-4 border-l-red-500 border-gray-200' :
              'border-l-4 border-l-blue-500 border-gray-200'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 size={16} className="text-green-600" />}
              {toast.type === 'error' && <AlertCircle size={16} className="text-red-600" />}
              {toast.type === 'info' && <Info size={16} className="text-blue-600" />}
            </div>
            <div className="flex-1 text-sm font-medium text-gray-900 pr-2 break-words">
              {toast.message}
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="shrink-0 p-1 -mr-1 -mt-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};