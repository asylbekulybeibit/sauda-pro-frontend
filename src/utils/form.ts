/**
 * Удаляет из объекта все свойства с пустыми строками
 * @param data Исходный объект с данными формы
 * @returns Новый объект без свойств с пустыми строками
 */
export const cleanFormData = <T extends Record<string, any>>(
  data: T
): Partial<T> => {
  const result = { ...data };

  Object.keys(result).forEach((key) => {
    const value = result[key];
    if (value === '') {
      delete result[key];
    }
  });

  return result;
};
