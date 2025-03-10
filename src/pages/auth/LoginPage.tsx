import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatPhoneNumber } from '@/utils/phone';

const loginSchema = z.object({
  phone: z.string().min(1, 'Введите номер телефона'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [digits, setDigits] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Если значение короче "+7", игнорируем изменение
    if (value.length < 2) return;

    // Получаем только цифры после "+7"
    let newDigits = '';
    if (value.startsWith('+7')) {
      newDigits = value.slice(2).replace(/\D/g, '');
    } else {
      newDigits = value.replace(/\D/g, '');
    }

    // Ограничиваем до 10 цифр
    newDigits = newDigits.slice(0, 10);
    setDigits(newDigits);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Разрешаем навигацию стрелками и Tab
    if (
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)
    ) {
      return;
    }

    // Предотвращаем удаление +7
    if (e.key === 'Backspace') {
      if (digits.length > 0) {
        e.preventDefault();
        setDigits(digits.slice(0, -1));
      } else {
        e.preventDefault();
      }
      return;
    }

    // Разрешаем ввод только цифр
    if (!/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  const onSubmit = (data: LoginForm) => {
    console.log(data);
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden bg-[#f8f9ff]">
      {/* Animated background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.8)_0.1px,transparent_0.1px),linear-gradient(90deg,rgba(255,255,255,0.8)_0.1px,transparent_0.1px)] bg-[size:24px_24px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] px-4 relative z-10"
      >
        <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 relative overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-white/0" />

          <div className="relative">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-4xl font-bold text-center mb-10 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"
            >
              Вход в систему
            </motion.h1>

            <motion.form
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <div className="space-y-3">
                <label className="text-lg font-medium text-gray-700">
                  Номер телефона
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...register('phone')}
                    value={formatPhoneNumber(digits)}
                    onChange={handlePhoneInput}
                    onKeyDown={handleKeyDown}
                    className="w-full h-16 pl-14 text-xl bg-white/50 border-gray-200 focus:border-violet-500 focus:ring-violet-500 rounded-xl transition-all duration-200"
                    placeholder="+7 (___) ___-__-__"
                  />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">
                    🇰🇿
                  </span>
                </div>
                {errors.phone && (
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-base"
                  >
                    {errors.phone.message}
                  </motion.span>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-16 text-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-200"
                type="submit"
              >
                Получить код
              </motion.button>
            </motion.form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
