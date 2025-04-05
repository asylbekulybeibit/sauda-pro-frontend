import React from 'react';
import { Modal } from '../ui/modal';
import styles from './ExtraFunctionsModal.module.css';

// Описание функции/кнопки
interface FunctionButton {
  label: string; // Текст кнопки
  onClick: () => void; // Обработчик клика
  id: string; // Уникальный идентификатор
}

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
  // Определяем доступные функции/кнопки
  const functionButtons: FunctionButton[] = [
    {
      id: 'client',
      label: 'ВЫБОР\nКЛИЕНТА',
      onClick: () => {
        onClientSelect();
        onClose();
      },
    },
    {
      id: 'vehicle',
      label: 'ВЫБОР\nАВТОМОБИЛЯ',
      onClick: () => {
        onVehicleSelect();
        onClose();
      },
    },
    // В будущем сюда можно добавить больше кнопок
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Дополнительные функции"
      className={styles.largeModal}
    >
      <div className={styles.modalContent}>
        <div className={styles.title}>Дополнительные функции</div>
        <div className={styles.buttonGrid}>
          {functionButtons.map((button) => (
            <button
              key={button.id}
              className={styles.functionButton}
              onClick={button.onClick}
            >
              {button.label}
            </button>
          ))}
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
