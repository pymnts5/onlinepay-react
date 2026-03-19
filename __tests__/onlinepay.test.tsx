import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OnlinePay from '../src/onlinepay';
import * as openpgp from 'openpgp';
import '@testing-library/jest-dom/vitest';

// Mock openpgp
vi.mock('openpgp', () => ({
  readKey: vi.fn().mockResolvedValue('publicKeyObject'),
  createMessage: vi.fn().mockResolvedValue('messageObject'),
  encrypt: vi.fn().mockResolvedValue('---ENCRYPTED DATA---'),
}));

const mockOnSubmitPayment = vi.fn();
const mockOnError = vi.fn();
const mockOnEncryptError = vi.fn();
const mockOnCardBrandChange = vi.fn();

const defaultProps = {
  publicKey: 'dGVzdC1rZXk=', // Valid base64 for 'test-key'
  onSubmitPayment: mockOnSubmitPayment,
  onError: mockOnError,
  onEncryptError: mockOnEncryptError,
  onCardBrandChange: mockOnCardBrandChange,
};

describe('OnlinePay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields and labels', () => {
    render(<OnlinePay {...defaultProps} />);
    expect(screen.getByLabelText('Card Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Expiry Date (MM/YY)')).toBeInTheDocument();
    expect(screen.getByLabelText('CVV')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay Now' })).toBeInTheDocument();
  });

  it('detects card brand and calls onCardBrandChange', async () => {
    const user = userEvent.setup();
    render(<OnlinePay {...defaultProps} />);
    const cardNumberInput = screen.getByLabelText('Card Number');

    await user.type(cardNumberInput, '4');
    expect(mockOnCardBrandChange).toHaveBeenCalledWith('visa');

    await user.clear(cardNumberInput);
    await user.type(cardNumberInput, '51');
    expect(mockOnCardBrandChange).toHaveBeenCalledWith('mastercard');

    await user.clear(cardNumberInput);
    await user.type(cardNumberInput, '37');
    expect(mockOnCardBrandChange).toHaveBeenCalledWith('amex');
  });

  it('validates expiry date and calls onError for past dates', async () => {
    const user = userEvent.setup();
    render(<OnlinePay {...defaultProps} />);

    // Fill in valid card and CVV first so validation proceeds to expiry
    const cardNumberInput = screen.getByLabelText('Card Number');
    await user.type(cardNumberInput, '4242424242424242'); // Valid Visa
    const cvvInput = screen.getByLabelText('CVV');
    await user.type(cvvInput, '123');

    const expiryInput = screen.getByLabelText('Expiry Date (MM/YY)');

    await user.type(expiryInput, '12/20'); // A date in the past
    await user.tab(); // to trigger blur

    expect(mockOnError).toHaveBeenCalledWith({ field: 'expiry' });
    expect(
      await screen.findByText('Please enter a valid expiry date.'),
    ).toBeInTheDocument();
  });

  it('shows custom tooltip text for amex cards', async () => {
    const user = userEvent.setup();
    const amexTooltipText = 'Custom Amex Tooltip';
    render(
      <OnlinePay {...defaultProps} amexCvvTooltipText={amexTooltipText} />,
    );
    const cardNumberInput = screen.getByLabelText('Card Number');
    const tooltipButton = screen.getByRole('button', {
      name: 'Show CVV information',
    });

    // Detect amex
    await user.type(cardNumberInput, '37');

    await user.hover(tooltipButton);

    expect(await screen.findByText(amexTooltipText)).toBeInTheDocument();
  });

  it('shows default tooltip text for non-amex cards', async () => {
    const user = userEvent.setup();
    const defaultTooltipText = 'Custom Default Tooltip';
    render(
      <OnlinePay
        {...defaultProps}
        defaultCvvTooltipText={defaultTooltipText}
      />,
    );
    const cardNumberInput = screen.getByLabelText('Card Number');
    const tooltipButton = screen.getByRole('button', {
      name: 'Show CVV information',
    });

    // Detect visa
    await user.type(cardNumberInput, '4');

    await user.hover(tooltipButton);

    expect(await screen.findByText(defaultTooltipText)).toBeInTheDocument();
  });

  it('disables submit button when form is invalid', () => {
    render(<OnlinePay {...defaultProps} />);
    const submitButton = screen.getByRole('button', { name: 'Pay Now' });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button and calls onSubmitPayment when form is valid', async () => {
    const user = userEvent.setup();
    render(<OnlinePay {...defaultProps} />);

    const cardNumberInput = screen.getByLabelText('Card Number');
    const expiryInput = screen.getByLabelText('Expiry Date (MM/YY)');
    const cvvInput = screen.getByLabelText('CVV');
    const submitButton = screen.getByRole('button', { name: 'Pay Now' });

    // Fill with valid Visa details
    await user.type(cardNumberInput, '4242424242424242'); // Valid Luhn
    await user.type(expiryInput, '12/30'); // Future date
    await user.type(cvvInput, '123');

    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    // Check if encryption and submission were called
    await waitFor(() => {
      expect(openpgp.encrypt).toHaveBeenCalled();
      expect(mockOnSubmitPayment).toHaveBeenCalledWith(
        btoa('---ENCRYPTED DATA---'),
      );
    });
  });

  it('calls onEncryptError if encryption fails', async () => {
    const user = userEvent.setup();
    const encryptionError = new Error('Encryption failed');
    vi.mocked(openpgp.encrypt).mockRejectedValueOnce(encryptionError);

    render(<OnlinePay {...defaultProps} />);

    const cardNumberInput = screen.getByLabelText('Card Number');
    const expiryInput = screen.getByLabelText('Expiry Date (MM/YY)');
    const cvvInput = screen.getByLabelText('CVV');
    const submitButton = screen.getByRole('button', { name: 'Pay Now' });

    // Fill with valid data
    await user.type(cardNumberInput, '4242424242424242');
    await user.type(expiryInput, '12/30');
    await user.type(cvvInput, '123');

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnEncryptError).toHaveBeenCalledWith(encryptionError);
      expect(mockOnSubmitPayment).not.toHaveBeenCalled();
    });
  });
});
