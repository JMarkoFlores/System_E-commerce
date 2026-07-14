import React, { useState } from 'react';
import { X, CreditCard, Smartphone, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';

const PaymentModal = ({ total, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [metodoPago, setMetodoPago] = useState('yape');
  const [procesando, setProcesando] = useState(false);
  const [tarjeta, setTarjeta] = useState({
    numero: '',
    nombre: '',
    expiracion: '',
    cvv: ''
  });

  const handlePagar = async () => {
    if (metodoPago === 'tarjeta') {
      if (!tarjeta.numero || !tarjeta.nombre || !tarjeta.expiracion || !tarjeta.cvv) {
        alert(t('payment.cardRequired'));
        return;
      }
    }

    setProcesando(true);
    // Simular procesamiento de pago
    setTimeout(() => {
      setProcesando(false);
      onConfirm(metodoPago);
    }, 1500);
  };

  const formatTarjeta = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    }
    return v;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{t('payment.title')}</h2>
            <p className="text-purple-100">{t('payment.totalToPay')}: <span className="font-bold text-xl">${total}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Selector de método */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setMetodoPago('yape')}
              className={`flex items-center justify-center space-x-2 p-3 rounded-xl border-2 transition ${
                metodoPago === 'yape'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-foreground'
              }`}
            >
              <Smartphone size={20} />
              <span className="font-semibold">{t('payment.yape')}</span>
            </button>
            <button
              onClick={() => setMetodoPago('tarjeta')}
              className={`flex items-center justify-center space-x-2 p-3 rounded-xl border-2 transition ${
                metodoPago === 'tarjeta'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-foreground'
              }`}
            >
              <CreditCard size={20} />
              <span className="font-semibold">{t('payment.card')}</span>
            </button>
          </div>

          {/* Contenido según método */}
          {metodoPago === 'yape' ? (
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl inline-block shadow-md">
                  <QRCodeSVG
                    value={`PAGO TECHSTORE AI - TOTAL: $${total}`}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="flex items-center justify-center mt-3 text-purple-700 dark:text-purple-300">
                  <QrCode size={20} className="mr-2" />
                  <span className="font-semibold">{t('payment.scanQR')}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('payment.scanInstructions')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment.cardNumber')}</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder={t('payment.cardNumberPlaceholder')}
                    maxLength={19}
                    value={tarjeta.numero}
                    onChange={(e) => setTarjeta({ ...tarjeta, numero: formatTarjeta(e.target.value) })}
                    className="w-full pl-10 pr-4 py-3 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment.cardName')}</label>
                <input
                  type="text"
                  placeholder={t('payment.cardNamePlaceholder')}
                  value={tarjeta.nombre}
                  onChange={(e) => setTarjeta({ ...tarjeta, nombre: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment.expiration')}</label>
                  <input
                    type="text"
                    placeholder={t('payment.expirationPlaceholder')}
                    maxLength={5}
                    value={tarjeta.expiracion}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setTarjeta({ ...tarjeta, expiracion: value });
                    }}
                    className="w-full px-4 py-3 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment.cvv')}</label>
                  <input
                    type="password"
                    placeholder={t('payment.cvvPlaceholder')}
                    maxLength={4}
                    value={tarjeta.cvv}
                    onChange={(e) => setTarjeta({ ...tarjeta, cvv: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handlePagar}
            disabled={procesando}
            className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {procesando ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {t('payment.processing')}
              </>
            ) : (
              t('payment.pay', { amount: total })
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
