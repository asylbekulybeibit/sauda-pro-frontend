import React, { useState } from 'react';
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
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  gap: 20px;
`;

const LeftSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RightSection = styled.div`
  display: flex;
  gap: 8px;
`;

const NumericSection = styled.div`
  display: flex;
  gap: 8px;
`;

const NumericPad = styled.div`
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

const Key = styled.button`
  height: 60px;
  min-width: 60px;
  border-radius: 8px;
  border: none;
  background: #00a65a;
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0 10px;
  outline: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  touch-action: manipulation;

  &:active {
    transform: translateY(2px);
    background: #008d4c;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
`;

const FuncKey = styled(Key)<{ active?: boolean }>`
  min-width: 100px;
  background: ${(props) => (props.active ? '#ccc' : 'white')};
  color: black;
  font-size: 18px;
  font-weight: bold;

  &:active {
    background: ${(props) => (props.active ? '#aaa' : '#eee')};
  }
`;

const SpaceKey = styled(Key)`
  width: 400px;
  background: #00a65a;
  color: white;

  &:active {
    background: #008d4c;
  }
`;

const NumKey = styled(Key)`
  width: 65px;
  height: 65px;
  font-size: 26px;
  font-weight: bold;
`;

const ZeroKey = styled(NumKey)`
  width: 138px;
`;

const CancelKey = styled(Key)`
  width: 100px;
  height: 65px;
  background: #dc3545;
  color: white;
  font-size: 18px;
  font-weight: bold;

  &:active {
    background: #c82333;
  }
`;

const OkKey = styled(Key)`
  width: 100px;
  height: 200px;
  background: #1890ff;
  color: white;
  font-size: 20px;
  font-weight: bold;

  &:active {
    background: #0c75df;
  }
`;

const BackspaceKey = styled(Key)`
  width: 140px;
  height: 65px;
  background: #dc3545;
  color: white;
  font-size: 22px;
  font-weight: bold;

  &:active {
    background: #c82333;
  }
`;

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onCancel: () => void;
  onOk: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  onCancel,
  onOk,
}) => {
  const [isShift, setIsShift] = useState(false);
  const [isSymbols, setIsSymbols] = useState(false);
  const [isEnglish, setIsEnglish] = useState(false);

  const russianLayout = {
    default: [
      ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х'],
      ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
      ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'],
    ],
    shift: [
      ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х'],
      ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
      ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю'],
    ],
  };

  const englishLayout = {
    default: [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ],
    shift: [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    ],
  };

  const symbolsLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['@', '#', '$', '%', '&', '*', '(', ')', '-', '+'],
    ['!', '"', "'", ':', ';', '/', '?', ',', '.'],
  ];

  const getCurrentLayout = () => {
    if (isSymbols) return symbolsLayout;
    if (isEnglish) return isShift ? englishLayout.shift : englishLayout.default;
    return isShift ? russianLayout.shift : russianLayout.default;
  };

  const handleKeyClick = (key: string) => {
    if (key === 'shift') {
      setIsShift(!isShift);
    } else {
      onKeyPress(key);
    }
  };

  const handleSymClick = () => {
    setIsSymbols(!isSymbols);
    setIsEnglish(false);
  };

  const handleEngClick = () => {
    setIsEnglish(!isEnglish);
    setIsSymbols(false);
  };

  return (
    <>
      <KeyboardContainer>
        <Layout>
          <LeftSection>
            {getCurrentLayout().map((row, rowIndex) => (
              <KeyboardRow key={rowIndex}>
                {row.map((key) => (
                  <Key key={key} onClick={() => handleKeyClick(key)}>
                    {key}
                  </Key>
                ))}
              </KeyboardRow>
            ))}
            <KeyboardRow>
              <FuncKey onClick={handleSymClick} active={isSymbols}>
                СИМ
              </FuncKey>
              <FuncKey onClick={handleEngClick} active={isEnglish}>
                ENG
              </FuncKey>
              <SpaceKey onClick={() => handleKeyClick(' ')} />
              <FuncKey onClick={() => setIsShift(!isShift)} active={isShift}>
                ⇧
              </FuncKey>
            </KeyboardRow>
          </LeftSection>
          <BackspaceKey onClick={() => handleKeyClick('backspace')}>
            ←
          </BackspaceKey>
          <RightSection>
            <NumericSection>
              <NumericPad>
                {[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                ].map((row, rowIndex) => (
                  <KeyboardRow key={rowIndex}>
                    {row.map((num) => (
                      <NumKey key={num} onClick={() => handleKeyClick(num)}>
                        {num}
                      </NumKey>
                    ))}
                  </KeyboardRow>
                ))}
                <KeyboardRow>
                  <ZeroKey onClick={() => handleKeyClick('0')}>0</ZeroKey>
                  <NumKey onClick={() => handleKeyClick('.')}>.</NumKey>
                </KeyboardRow>
              </NumericPad>
              <SideButtons>
                <CancelKey onClick={onCancel}>ОТМЕНА</CancelKey>
                <OkKey onClick={onOk}>OK</OkKey>
              </SideButtons>
            </NumericSection>
          </RightSection>
        </Layout>
      </KeyboardContainer>
    </>
  );
};

export default VirtualKeyboard;
