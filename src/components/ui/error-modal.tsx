import { motion, AnimatePresence } from 'framer-motion';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function ErrorModal({ isOpen, onClose, message }: ErrorModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-center mb-4 text-red-500 text-4xl">
                ⚠️
              </div>
              <h3 className="text-lg font-medium text-center mb-4">Ошибка</h3>
              <p className="text-gray-600 text-center mb-6">{message}</p>
              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
