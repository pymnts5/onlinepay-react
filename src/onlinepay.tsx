import React from 'react';
import { useState } from 'react';
import * as openpgp from 'openpgp';
import amexLogo from './assets/amex.svg';
import jcbLogo from './assets/jcb.svg';
import mastercardLogo from './assets/mastercard.svg';
import visaLogo from './assets/visa.svg';
import {
  defaultClasses,
  OnlinePayClasses,
  semanticClasses,
} from './onlinepay.classes';

interface OnlinePayProps {
  onSubmitPayment: (encryptedCard: string) => void;
  onError: (args: { field: string }) => void;
  onEncryptError?: (error: Error) => void;
  onCardBrandChange?: (brand: string) => void;
  publicKey: string;
  headingText?: string;
  cardLabel?: string;
  expiryLabel?: string;
  cvvLabel?: string;
  payButtonLabel?: string;
  classes?: OnlinePayClasses;
  styling?: 'tailwind' | 'css';
  amexCvvTooltipText?: string;
  defaultCvvTooltipText?: string;
}

const brandLogos: { [key: string]: string } = {
  amex: amexLogo,
  jcb: jcbLogo,
  mastercard: mastercardLogo,
  visa: visaLogo,
};

const OnlinePay = ({
  onSubmitPayment,
  onError,
  onEncryptError,
  onCardBrandChange,
  publicKey,
  headingText = 'Credit Card Payment',
  cardLabel = 'Card Number',
  expiryLabel = 'Expiry Date (MM/YY)',
  cvvLabel = 'CVV',
  payButtonLabel = 'Pay Now',
  classes = {},
  styling = 'tailwind',
  amexCvvTooltipText = 'The 4-digit code on the front of your card.',
  defaultCvvTooltipText = 'The 3-digit code on the back of your card.',
}: OnlinePayProps) => {
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
  const [cardBrand, setCardBrand] = useState('');
  const [showCvvTooltip, setShowCvvTooltip] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const expiryInputRef = React.useRef<HTMLInputElement>(null);
  const cvvInputRef = React.useRef<HTMLInputElement>(null);

  // Generate unique IDs for form fields to ensure accessibility and prevent ID collisions
  const formId = React.useId();
  const cardFieldId = `card-number-${formId}`;
  const cardErrorId = `card-error-${formId}`;
  const expiryFieldId = `expiry-date-${formId}`;
  const expiryErrorId = `expiry-error-${formId}`;
  const cvvFieldId = `cvv-${formId}`;
  const cvvErrorId = `cvv-error-${formId}`;

  const baseClasses = styling === 'css' ? semanticClasses : defaultClasses;
  const mergedClasses = { ...baseClasses, ...classes };

  const detectCardBrand = (number: string) => {
    const brands: { [key: string]: RegExp } = {
      amex: /^3[47]/,
      visa: /^4/,
      mastercard: /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/,
      jcb: /^35(2[89]|[3-8][0-9])/,
    };
    for (const [brand, regex] of Object.entries(brands)) {
      if (regex.test(number)) return brand;
    }
    return '';
  };

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
    const brand = detectCardBrand(cardNumber);
    const cardHasError = validateCardNumber(cardNumber, brand);
    const cvvHasError = validateCvvNumber(cvv, brand);
    const expiryHasError = validateExpiryDate(expiryMonth, expiryYear);

    setCardError(cardHasError);
    setCvvError(cvvHasError);
    setExpiryError(expiryHasError);

    const hasAnyError = cardHasError || cvvHasError || expiryHasError;
    setHasError(hasAnyError);

    if (cardHasError) {
      onError({ field: 'card' });
    } else if (cvvHasError) {
      onError({ field: 'cvv' });
    } else if (expiryHasError) {
      onError({ field: 'expiry' });
    } else {
      onError({ field: '' });
    }
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // remove non-digit characters
    const brand = detectCardBrand(rawValue);
    setCardBrand(brand);
    onCardBrandChange?.(brand || '');

    let formattedValue = rawValue;
    if (brand === 'amex') {
      if (rawValue.length > 10) {
        formattedValue = `${rawValue.slice(0, 4)} ${rawValue.slice(4, 10)} ${rawValue.slice(10)}`;
      } else if (rawValue.length > 4) {
        formattedValue = `${rawValue.slice(0, 4)} ${rawValue.slice(4)}`;
      }
    } else {
      formattedValue = rawValue.replace(/(.{4})/g, '$1 ').trim(); // insert space every 4 digits
    }

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

    if (!validateCardNumber(rawValue, brand)) {
      expiryInputRef.current?.focus();
    }
  };

  const luhnCheck = (val: string) => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = val.length - 1; i >= 0; i--) {
      let digit = parseInt(val.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const validateCardNumber = (card: string, brand: string) => {
    if (brand === 'amex') {
      return !(card.length === 15 && luhnCheck(card));
    }
    if (brand === 'visa' || brand === 'mastercard') {
      return !(card.length === 16 && luhnCheck(card));
    }
    if (brand === 'jcb') {
      return !(card.length >= 16 && card.length <= 19 && luhnCheck(card));
    }
    if (card.length < 13 || card.length > 19) {
      return true;
    }
    return !luhnCheck(card);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvvShowError(true);
    setFormData((prev) => ({ ...prev, cvv: value }));
    validateForm({
      cardNumber: formData.cardNumberRaw,
      cvv: value,
      expiryMonth: formData.expiryMonth,
      expiryYear: formData.expiryYear,
    });
  };

  const validateCvvNumber = (cvv: string, brand: string): boolean => {
    if (!cvv || cvv === '') {
      return true;
    }
    const length = cvv.length;
    if (brand === 'amex') {
      return length !== 4;
    }
    // Default to 3 for others
    return length !== 3;
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

      if (!validateExpiryDate(expiryMonthStr, expiryYearStr)) {
        cvvInputRef.current?.focus();
      }
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
    if (!expiryMonth || !expiryYear) {
      return true;
    }
    const month = parseInt(expiryMonth, 10);
    const year = parseInt(expiryYear, 10);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return true;
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-indexed

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const encryptedCard = await encryptCard();
      onSubmitPayment(encryptedCard);
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      if (onEncryptError) {
        onEncryptError(error as Error);
      }
    }
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
    <form onSubmit={handleSubmit} className={mergedClasses.container}>
      <h2 className={mergedClasses.heading}>{headingText}</h2>
      <div className={mergedClasses.fieldWrapper}>
        <label htmlFor={cardFieldId} className={mergedClasses.label}>
          {cardLabel}
        </label>
        <div className={mergedClasses.inputWrapper}>
          <input
            id={cardFieldId}
            type='text'
            name='cardNumber'
            value={formData.cardNumber}
            onChange={handleCardChange}
            onBlur={() => setCardShowError(true)}
            required
            // 19 digits + 4 spaces = 23 characters max
            maxLength={23}
            inputMode='numeric'
            autoComplete='cc-number'
            aria-invalid={cardError && cardShowError}
            aria-describedby={
              cardError && cardShowError ? cardErrorId : undefined
            }
            className={`${mergedClasses.input} ${
              cardError && cardShowError ? mergedClasses.inputError : ''
            }`}
          />
          {cardBrand && brandLogos[cardBrand] && (
            <img
              src={brandLogos[cardBrand]}
              alt={`${cardBrand} logo`}
              className={mergedClasses.cardIcon}
            />
          )}
        </div>
        {cardError && cardShowError && (
          <p id={cardErrorId} className={mergedClasses.errorText}>
            Please enter a valid card number.
          </p>
        )}
      </div>

      <div className={mergedClasses.grid}>
        <div className={mergedClasses.gridChild}>
          <div className={mergedClasses.labelWrapper}>
            <label htmlFor={expiryFieldId} className={mergedClasses.label}>
              {expiryLabel}
            </label>
          </div>
          <input
            ref={expiryInputRef}
            id={expiryFieldId}
            type='text'
            name='expiryDate'
            value={formData.expiryDateRaw}
            onChange={handleExpiryChange}
            onBlur={() => setExpiryShowError(true)}
            required
            placeholder='MM/YY'
            inputMode='numeric'
            autoComplete='cc-exp'
            aria-invalid={expiryError && expiryShowError}
            aria-describedby={
              expiryError && expiryShowError ? expiryErrorId : undefined
            }
            className={`${mergedClasses.input} ${
              expiryError && expiryShowError ? mergedClasses.inputError : ''
            }`}
          />
          {expiryError && expiryShowError && (
            <p id={expiryErrorId} className={mergedClasses.errorText}>
              Please enter a valid expiry date.
            </p>
          )}
        </div>

        <div className={mergedClasses.gridChild}>
          <div className={mergedClasses.labelWrapper}>
            <label htmlFor={cvvFieldId} className={mergedClasses.label}>
              {cvvLabel}
            </label>
            <div className={mergedClasses.tooltipWrapper}>
              <button
                type='button'
                aria-label='Show CVV information'
                className={mergedClasses.tooltipButton}
                onMouseEnter={() => setShowCvvTooltip(true)}
                onMouseLeave={() => setShowCvvTooltip(false)}
                onClick={() => setShowCvvTooltip(!showCvvTooltip)}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className={mergedClasses.tooltipIcon}
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
              {showCvvTooltip && (
                <div className={mergedClasses.tooltipPopover}>
                  {cardBrand === 'amex'
                    ? amexCvvTooltipText
                    : defaultCvvTooltipText}
                  <div className={mergedClasses.tooltipArrow}></div>
                </div>
              )}
            </div>
          </div>
          <div className={mergedClasses.inputWrapper}>
            <input
              ref={cvvInputRef}
              id={cvvFieldId}
              type={showCvv ? 'text' : 'password'}
              name='cvv'
              value={formData.cvv}
              onChange={handleCvvChange}
              onBlur={() => setCvvShowError(true)}
              required
              maxLength={4}
              inputMode='numeric'
              autoComplete='cc-csc'
              aria-invalid={cvvError && cvvShowError}
              aria-describedby={
                cvvError && cvvShowError ? cvvErrorId : undefined
              }
              className={`${mergedClasses.input} ${
                cvvError && cvvShowError ? mergedClasses.inputError : ''
              }`}
            />
            <button
              type='button'
              onClick={() => setShowCvv(!showCvv)}
              aria-label={showCvv ? 'Hide CVV' : 'Show CVV'}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#9CA3AF',
              }}
            >
              {showCvv ? (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  width='15'
                  height='15'
                >
                  <path
                    fillRule='evenodd'
                    d='M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z'
                    clipRule='evenodd'
                  />
                  <path d='M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.742L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z' />
                </svg>
              ) : (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  width='15'
                  height='15'
                >
                  <path d='M10 12a2 2 0 100-4 2 2 0 000 4z' />
                  <path
                    fillRule='evenodd'
                    d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
            </button>
          </div>
          {cvvError && cvvShowError && (
            <p id={cvvErrorId} className={mergedClasses.errorText}>
              Please enter a valid CVV.
            </p>
          )}
        </div>
      </div>

      <button
        type='submit'
        className={mergedClasses.button}
        disabled={hasError || isProcessing}
      >
        {isProcessing ? (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <svg
              className='animate-spin'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              width='16'
              height='16'
            >
              <circle
                style={{ opacity: 0.25 }}
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                style={{ opacity: 0.75 }}
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          payButtonLabel
        )}
      </button>
    </form>
  );
};

export default OnlinePay;
