import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

// Стили для плавающего поля ввода
const FloatingContainer = styled.div`
  position: fixed;
  top: 70px; // Позиция сверху экрана
  left: 0;
  right: 0;
  background-color: white;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  z-index: 1200; // Выше других элементов, но ниже клавиатуры
  display: flex;
  flex-direction: column;
  border-bottom: 3px solid #3498db;
  margin: 0 auto;
  max-width: 90%;
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const FieldLabel = styled.div`
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
`;

const InputField = styled.input`
  width: 100%;
  height: 50px;
  padding: 12px 15px;
  font-size: 18px;
  border: 2px solid #3498db;
  border-radius: 6px;
  background-color: #f9f9f9;
  margin-bottom: 5px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  caret-color: #2980b9; /* Цвет курсора ввода */
  caret-shape: bar; /* Форма курсора (работает в некоторых браузерах) */

  &:focus {
    outline: none;
    border-color: #2980b9;
    background-color: white;
  }
`;

const Hint = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 3px;
  font-style: italic;
`;

interface FloatingInputProps {
  fieldName: string; // Название поля
  value: string; // Текущее значение
  onChange: (value: string) => void; // Обработчик изменения
  type?: string; // Тип поля (текст, число и т.д.)
  placeholder?: string; // Подсказка
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  fieldName,
  value,
  onChange,
  type = 'text',
  placeholder,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCursorPosition = useRef<number>(value.length); // Храним позицию курсора

  // Для полей типа number будем использовать тип text с паттерном
  // Это позволит использовать setSelectionRange и при этом сохранить валидацию
  const inputType = type === 'number' ? 'text' : type;
  const inputPattern = type === 'number' ? '[0-9]*(\\.[0-9]+)?' : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Сохраняем текущую позицию курсора
    if (inputRef.current) {
      lastCursorPosition.current = inputRef.current.selectionStart || 0;
    }

    // Для числовых полей проверяем, что ввод соответствует числовому формату
    if (type === 'number') {
      // Разрешаем только цифры, точку и пустую строку
      if (/^$|^[0-9]*\.?[0-9]*$/.test(e.target.value)) {
        onChange(e.target.value);
      }
    } else {
      onChange(e.target.value);
    }
  };

  // При изменении значения восстанавливаем позицию курсора
  useEffect(() => {
    if (inputRef.current) {
      try {
        inputRef.current.setSelectionRange(
          lastCursorPosition.current,
          lastCursorPosition.current
        );
      } catch (error) {
        console.warn('Failed to set selection range:', error);
      }
    }
  }, [value]);

  // Автоматически фокусируемся на поле ввода при монтировании
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        try {
          // Устанавливаем курсор в конец текста по умолчанию
          inputRef.current.setSelectionRange(value.length, value.length);
        } catch (error) {
          console.warn('Failed to set selection range on focus:', error);
        }
      }
    }, 100);
  }, []);

  return (
    <FloatingContainer>
      <FieldLabel>Ввод данных: {fieldName}</FieldLabel>
      <InputField
        ref={inputRef}
        type={inputType}
        pattern={inputPattern}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
      />
      <Hint>Значение будет автоматически применено к полю «{fieldName}»</Hint>
    </FloatingContainer>
  );
};

export default FloatingInput;
