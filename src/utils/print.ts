export const printElement = (elementId: string) => {
  const printContent = document.getElementById(elementId);
  if (!printContent) return;

  const originalDisplay = document.body.style.display;
  const originalOverflow = document.body.style.overflow;

  // Создаем iframe для печати
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';

  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentWindow?.document;
  if (!frameDoc) return;

  // Копируем стили
  const styles = document.getElementsByTagName('style');
  const links = document.getElementsByTagName('link');

  frameDoc.write('<html><head>');

  // Копируем CSS
  for (let i = 0; i < styles.length; i++) {
    frameDoc.write(styles[i].outerHTML);
  }

  // Копируем внешние стили
  for (let i = 0; i < links.length; i++) {
    if (links[i].rel === 'stylesheet') {
      frameDoc.write(links[i].outerHTML);
    }
  }

  // Добавляем стили для печати
  frameDoc.write(`
    <style>
      @media print {
        body {
          padding: 20px;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          page-break-after: always;
        }
      }
    </style>
  `);

  frameDoc.write('</head><body>');
  frameDoc.write(printContent.innerHTML);
  frameDoc.write('</body></html>');
  frameDoc.close();

  // Ждем загрузки стилей и изображений
  printFrame.onload = () => {
    try {
      printFrame.contentWindow?.print();

      // Восстанавливаем оригинальные стили и удаляем фрейм
      setTimeout(() => {
        document.body.style.display = originalDisplay;
        document.body.style.overflow = originalOverflow;
        document.body.removeChild(printFrame);
      }, 500);
    } catch (error) {
      console.error('Ошибка при печати:', error);
    }
  };
};
