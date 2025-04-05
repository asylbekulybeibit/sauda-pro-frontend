import React from 'react';
import { Modal } from '../ui/modal';
import styles from './ExtraFunctionsModal.module.css';

interface ExtraFunctionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelect: () => void;
  onVehicleSelect: () => void;
}

const ExtraFunctionsModal: React.FC<ExtraFunctionsModalProps> = ({
  isOpen,
  onClose,
  onClientSelect,
  onVehicleSelect,
}) => {
  const handleClientClick = () => {
    onClientSelect();
    onClose();
  };

  const handleVehicleClick = () => {
    onVehicleSelect();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Дополнительные функции">
      <div className={styles.modalContent}>
        <div className={styles.title}>Дополнительные функции</div>
        <div className={styles.buttonGrid}>
          <button className={styles.functionButton} onClick={handleClientClick}>
            ВЫБОР{'\n'}КЛИЕНТА
          </button>
          <button
            className={styles.functionButton}
            onClick={handleVehicleClick}
          >
            ВЫБОР{'\n'}АВТОМОБИЛЯ
          </button>
        </div>
        <div className={styles.closeButtonContainer}>
          <button className={styles.closeButton} onClick={onClose}>
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExtraFunctionsModal;
