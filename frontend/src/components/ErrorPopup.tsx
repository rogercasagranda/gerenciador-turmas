// frontend/src/components/ErrorPopup.tsx

import React, { useEffect } from 'react';

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
    <div style={styles.overlay}>
      <div style={styles.popup}>
        <button style={styles.closeButton} onClick={onClose}>×</button>
        <p>{message}</p>
      </div>
    </div>
  );
};

// Estilos inline apenas para demonstração visual, pode ser transferido para CSS
const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  popup: {
    background: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(0,0,0,0.25)',
    position: 'relative',
    maxWidth: '400px',
    textAlign: 'center'
  },
  closeButton: {
    position: 'absolute',
    top: '5px',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer'
  }
};

export default ErrorPopup;
