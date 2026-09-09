import { useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import "./Toast.css";

/**
 * Lightweight, self-contained toast used to replace native alert()/confirm()
 * popups across pages. Drop <ToastHost toasts={toasts} onClose={...}/> once
 * per page and call showToast(message, type) from the returned hook.
 */
export function useToastState() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const closeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, closeToast };
}

export function ToastHost({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-card toast-${t.type}`}>
          {t.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onClose(t.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
