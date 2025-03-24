import { api } from '@/services/api';

/**
 * Интерфейс для данных уведомления в WhatsApp
 */
interface WhatsAppNotificationData {
  phoneNumber: string;
  message: string;
}

/**
 * Отправляет уведомление через WhatsApp
 * @param phoneNumber Номер телефона получателя в формате +79XXXXXXXXX
 * @param message Текст сообщения
 * @returns Promise с результатом отправки
 */
export const sendWhatsAppNotification = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    // В реальном приложении здесь должен быть запрос к API для отправки уведомления
    // Например:
    // await api.post('/notifications/whatsapp', { phoneNumber, message });

    // В данной реализации просто имитируем успешную отправку и логируем данные
    console.log(`📱 Отправка уведомления WhatsApp`, {
      phoneNumber,
      message,
    });

    // Возвращаем true для имитации успешной отправки
    return true;
  } catch (error) {
    console.error('Ошибка при отправке уведомления в WhatsApp:', error);
    return false;
  }
};

/**
 * Отправляет уведомление менеджеру магазина об открытии смены
 * @param shopId ID магазина
 * @param registerName Название кассы
 * @param cashierName Имя кассира
 * @returns Promise с результатом отправки
 */
export const sendShiftOpenNotification = async (
  shopId: string,
  registerName: string,
  cashierName: string
): Promise<boolean> => {
  try {
    // Здесь можно сделать запрос для получения номера телефона менеджера магазина
    // const { data } = await api.get(`/shops/${shopId}/manager-phone`);
    // const managerPhone = data.phone;

    // Для демонстрации используем заглушку
    const managerPhone = '+79000000000';

    // Формируем текст сообщения
    const message = `
🔔 *Уведомление SaudaPro*
✅ Открыта смена на кассе "${registerName}"
👤 Кассир: ${cashierName}
🕒 Время: ${new Date().toLocaleString()}
🏪 Магазин ID: ${shopId}
    `.trim();

    // Отправляем уведомление
    return await sendWhatsAppNotification(managerPhone, message);
  } catch (error) {
    console.error('Ошибка при отправке уведомления об открытии смены:', error);
    return false;
  }
};

/**
 * Отправляет уведомление менеджеру магазина о закрытии смены
 * @param shopId ID магазина
 * @param registerName Название кассы
 * @param cashierName Имя кассира
 * @returns Promise с результатом отправки
 */
export const sendShiftCloseNotification = async (
  shopId: string,
  registerName: string,
  cashierName: string
): Promise<boolean> => {
  try {
    // Здесь можно сделать запрос для получения номера телефона менеджера магазина
    // const { data } = await api.get(`/shops/${shopId}/manager-phone`);
    // const managerPhone = data.phone;

    // Для демонстрации используем заглушку
    const managerPhone = '+79000000000';

    // Формируем текст сообщения
    const message = `
🔔 *Уведомление SaudaPro*
❌ Закрыта смена на кассе "${registerName}"
👤 Кассир: ${cashierName}
🕒 Время: ${new Date().toLocaleString()}
🏪 Магазин ID: ${shopId}
    `.trim();

    // Отправляем уведомление
    return await sendWhatsAppNotification(managerPhone, message);
  } catch (error) {
    console.error('Ошибка при отправке уведомления о закрытии смены:', error);
    return false;
  }
};

export default {
  sendWhatsAppNotification,
  sendShiftOpenNotification,
  sendShiftCloseNotification,
};
