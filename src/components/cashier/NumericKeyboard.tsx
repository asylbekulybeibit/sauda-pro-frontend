import React from 'react';
import styled from '@emotion/styled';

const KeyboardContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #d1d5db;
  padding: 10px;
  z-index: 1100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  border-top: 1px solid #bbb;
`;

const Layout = styled.div`
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  gap: 20px;
`;

const NumericPad = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SideButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const KeyboardRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const NumKey = styled.button`
  width: 65px;
  height: 65px;
  border-radius: 8px;
  border: none;
  background: #00a65a;
  color: white;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  touch-action: manipulation;

  &:active {
    transform: translateY(2px);
    background: #008d4c;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
`;

const ZeroKey = styled(NumKey)`
  width: 65px; /* Одинаковая ширина для всех кнопок */
`;

const DotKey = styled(NumKey)`
  /* Удаляем условное отображение, чтобы точка была всегда видна */
`;

const BackspaceKey = styled(NumKey)`
  width: 65px;
  background: #dc3545;
  font-size: 22px;

  &:active {
    background: #c82333;
  }
`;

const CancelKey = styled.button`
  width: 100px;
  height: 65px;
  background: #dc3545;
  color: white;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  touch-action: manipulation;

  &:active {
    transform: translateY(2px);
    background: #c82333;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
`;

const OkKey = styled.button`
  width: 100px;
  height: 138px;
  background: #1890ff;
  color: white;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  touch-action: manipulation;

  &:active {
    transform: translateY(2px);
    background: #0c75df;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
`;

interface NumericKeyboardProps {
  onKeyPress: (key: string) => void;
  onCancel: () => void;
  onOk: () => void;
  includeDecimal?: boolean;
}

const NumericKeyboard: React.FC<NumericKeyboardProps> = ({
  onKeyPress,
  onCancel,
  onOk,
  includeDecimal = false,
}) => {
  return (
    <>
      <KeyboardContainer>
        <Layout>
          <NumericPad>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
            ].map((row, rowIndex) => (
              <KeyboardRow key={rowIndex}>
                {row.map((num) => (
                  <NumKey key={num} onClick={() => onKeyPress(num)}>
                    {num}
                  </NumKey>
                ))}
              </KeyboardRow>
            ))}
            <KeyboardRow>
              <ZeroKey onClick={() => onKeyPress('0')}>0</ZeroKey>
              <DotKey onClick={() => onKeyPress('.')}>.</DotKey>
              <BackspaceKey onClick={() => onKeyPress('backspace')}>
                ←
              </BackspaceKey>
            </KeyboardRow>
          </NumericPad>
          <SideButtons>
            <CancelKey onClick={onCancel}>ОТМЕНА</CancelKey>
            <OkKey onClick={onOk}>OK</OkKey>
          </SideButtons>
        </Layout>
      </KeyboardContainer>
    </>
  );
};

export default NumericKeyboard;
