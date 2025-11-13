import React from 'react';
import { useState } from 'react';
import * as openpgp from 'openpgp';
// import "./onlinepay.css";
import './index.css';

interface OnlinePayProps {
  onSubmitPayment: (encryptedCard: string) => void;
  onError: (args: { field: string }) => void;
  publicKey: string;
}

const OnlinePay = ({ onSubmitPayment, onError, publicKey }: OnlinePayProps) => {
  const [hasError, setHasError] = useState(true);
  const [cardError, setCardError] = useState(true);
  const [cardShowError, setCardShowError] = useState(false);
  const [expiryError, setExpiryError] = useState(true);
  const [expiryShowError, setExpiryShowError] = useState(false);
  const [cvvError, setCvvError] = useState(true);
  const [cvvShowError, setCvvShowError] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardNumberRaw: '',
    expiryDateRaw: '',
    expiryMonth: '00',
    expiryYear: '00',
    cvv: '',
  });

  const validateForm = ({
    cardNumber,
    cvv,
    expiryMonth,
    expiryYear,
  }: {
    cardNumber: string;
    cvv: string;
    expiryMonth: string;
    expiryYear: string;
  }) => {
    const cardHasError = validateCardNumber(cardNumber);
    const cvvHasError = validateCvvNumber(cvv);
    const expiryHasError = validateExpiryDate(expiryMonth, expiryYear);

    if (cardHasError) {
      onError({
        field: 'card',
      });
    } else {
      onError({
        field: '',
      });
    }
    if (cvvHasError) {
      onError({
        field: 'cvv',
      });
    } else {
      onError({
        field: '',
      });
    }
    if (expiryHasError) {
      if (formData.expiryDateRaw === '') {
        onError({
          field: 'expiry',
        });
      } else {
        onError({
          field: 'expiry',
        });
      }
    } else {
      onError({
        field: '',
      });
    }

    setCardError(cardHasError);
    setCvvError(cvvHasError);
    setExpiryError(expiryHasError);

    const hasAnyError = cardHasError || cvvHasError || expiryHasError;
    setHasError(hasAnyError);
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // remove non-digit characters
    const formattedValue = rawValue.replace(/(.{4})/g, '$1 ').trim(); // insert space every 4 digits
    setFormData((prev) => ({
      ...prev,
      cardNumber: formattedValue,
      cardNumberRaw: rawValue,
    }));
    validateForm({
      cardNumber: rawValue,
      cvv: formData.cvv,
      expiryMonth: formData.expiryMonth,
      expiryYear: formData.expiryYear,
    });
  };

  const validateCardNumber = (card: string) => {
    if (card.length !== 16) {
      return true;
    }
    return false;
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvvShowError(true);
    setFormData((prev) => ({ ...prev, cvv: e.target.value }));
    validateForm({
      cardNumber: formData.cardNumberRaw,
      cvv: e.target.value,
      expiryMonth: formData.expiryMonth,
      expiryYear: formData.expiryYear,
    });
  };

  const validateCvvNumber = (cvv: string): boolean => {
    if (cvv && cvv !== '') {
      const length = cvv.length;
      if (length === 3 || length === 4) {
        return false;
      }
    }
    return true;
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters

    // Auto-insert slash after MM
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }

    // Update the raw expiry string (optional if you want to display it)
    setFormData((prev) => ({
      ...prev,
      expiryDateRaw: value,
    }));

    // Parse MM/YY if valid
    const [month, year] = value.split('/');
    if (
      month &&
      year &&
      month.length === 2 &&
      year.length === 2 &&
      !isNaN(Number(month)) &&
      !isNaN(Number(year))
    ) {
      const expiryMonth = parseInt(month, 10);
      const expiryYear = parseInt(`20${year}`, 10); // Assumes 20YY format

      const expiryMonthStr = expiryMonth.toString();
      const expiryYearStr = expiryYear.toString();

      setFormData((prev) => ({
        ...prev,
        expiryMonth: expiryMonthStr,
        expiryYear: expiryYearStr,
      }));
      validateForm({
        cardNumber: formData.cardNumberRaw,
        cvv: formData.cvv,
        expiryMonth: expiryMonthStr,
        expiryYear: expiryYearStr,
      });
    } else {
      validateForm({
        cardNumber: formData.cardNumberRaw,
        cvv: formData.cvv,
        expiryMonth: '00',
        expiryYear: '00',
      });
    }
  };

  const validateExpiryDate = (expiryMonth: string, expiryYear: string) => {
    const month = parseInt(expiryMonth, 10);
    const year = parseInt(expiryYear, 10);

    if (month < 1 && month > 12) {
      return true;
    }

    // Check if expiry year is less than current year
    if (year < new Date().getFullYear()) {
      return true;
    }

    // Check if expiry month and year are invalid
    if (year <= new Date().getFullYear() && month < new Date().getMonth()) {
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const encryptedCard = await encryptCard();
    onSubmitPayment(encryptedCard);
  };

  const encryptCard = async () => {
    const cardData = {
      cardNumber: formData.cardNumberRaw,
      expiryMonth: formData.expiryMonth,
      expiryYear: formData.expiryYear,
      cvv: formData.cvv,
      captureTime: new Date().toISOString().split('.')[0] + 'Z',
    };

    const publicKeyString = await openpgp.readKey({
      armoredKey: atob(publicKey),
    });
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: JSON.stringify(cardData) }),
      encryptionKeys: publicKeyString,
      config: { rejectCurves: new Set() },
    });

    // Get the encrypted card data
    return btoa(encrypted);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='max-w-md mx-auto p-6 bg-white shadow-md rounded-md space-y-4'
    >
      <h2 className='text-2xl font-semibold text-gray-800 mb-4'>
        Credit Card Payment
      </h2>
      <div>
        <label className='block text-sm font-medium text-gray-700'>
          Card Number
        </label>
        <input
          type='text'
          name='cardNumber'
          value={formData.cardNumber}
          onChange={handleCardChange}
          onBlur={() => setCardShowError(true)}
          required
          maxLength={19}
          className={`mt-1 block w-full px-3 py-2 text-gray-900 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
            cardError && cardShowError ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {cardError && cardShowError && (
          <p className='mt-1 text-sm text-red-600'>
            Please enter a valid card number.
          </p>
        )}
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            Expiry Date (MM/YY)
          </label>
          <input
            type='text'
            name='expiryDate'
            value={formData.expiryDateRaw}
            onChange={handleExpiryChange}
            onBlur={() => setExpiryShowError(true)}
            required
            placeholder='MM/YY'
            className={`mt-1 block w-full px-3 py-2 text-gray-900 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              expiryError && expiryShowError
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          />
          {expiryError && expiryShowError && (
            <p className='mt-1 text-sm text-red-600'>
              Please enter a valid expiry date.
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-500'>CVV</label>
          <input
            type='password'
            name='cvv'
            value={formData.cvv}
            onChange={handleCvvChange}
            onBlur={() => setCvvShowError(true)}
            required
            maxLength={4}
            className={`mt-1 block w-full px-3 py-2 text-gray-900 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              cvvError && cvvShowError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {cvvError && cvvShowError && (
            <p className='mt-1 text-sm text-red-600'>
              Please enter a valid CVV.
            </p>
          )}
        </div>
      </div>

      <button
        type='submit'
        className={`w-full py-2 px-4 rounded-md transition-colors ${
          hasError
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
        disabled={hasError}
      >
        Pay Now
      </button>
    </form>
  );
};

export default OnlinePay;
