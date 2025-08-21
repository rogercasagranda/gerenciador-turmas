// frontend/src/components/ErrorPopup.tsx

import React, { useEffect } from 'react';
import '../styles/ErrorPopup.css';

interface ErrorPopupProps {
  message: string;
  onClose: () => void;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(); // chama a função de fechar após 10 segundos
    }, 10000);

    return () => clearTimeout(timer); // limpa o timer se o componente for desmontado
  }, [onClose]);

  return (
    <div className="error-overlay">
      <div className="error-popup">
        <button className="button error-close-button" onClick={onClose}>×</button>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default ErrorPopup;
