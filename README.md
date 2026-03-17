# onlinepay-react

A secure, customisable, and easy-to-use [React](https://react.dev/) component for accepting [Westpac OnlinePay](https://merchants.westpac.com.au/onlinepay/docs/getting-started) payments. This [React](https://react.dev/) component handles input formatting, validation and encryption ready for payment processing.

## Features

- **Automatic Formatting**: Formats card number and expiry date as the user types.
- **Real-time Validation**: Validates card number (Luhn check), expiry date, and CVV.
- **Card Brand Detection**: Automatically detects and displays logos for Visa, Mastercard, American Express, JCB, and more.
- **Client-Side Encryption**: Encrypts card details ready for payment processing.
- **Flexible Styling**: Works with Tailwind CSS out of the box, provides a fallback CSS file, and allows for deep customisation.

## Live Demo

You can try out a live demo of the component here: [https://pymnts5.github.io/onlinepay-react/](https://pymnts5.github.io/onlinepay-react/)

## Installation

```bash
npm install onlinepay-react
```

## Usage & Styling

The component is designed to be flexible, supporting projects with and without Tailwind CSS.

### With Tailwind CSS (Default)

If your project uses Tailwind CSS, the component will work seamlessly. Just ensure your `tailwind.config.js` is set up to scan the component's files for classes.

1.  **Update `tailwind.config.js`:**
    Add the path to `onlinepay-react`'s distributed files in your `content` array.

    ```javascript
    // tailwind.config.js
    module.exports = {
      content: [
        './src/**/*.{js,ts,jsx,tsx}',
        // Add this line:
        './node_modules/onlinepay-react/dist/**/*.js',
      ],
      // ...
    };
    ```

2.  **Use the component:**

    ```tsx
    import OnlinePay from 'onlinepay-react';

    function MyCheckoutPage() {
      return (
        <OnlinePay
          publicKey='YOUR_BASE64_ENCODED_PUBLIC_KEY'
          onSubmitPayment={(encryptedCard) => {
            console.log('Encrypted card:', encryptedCard);
            // Send to your server
          }}
          onError={({ field }) => console.log(`Error in field: ${field}`)}
        />
      );
    }
    ```

### Without Tailwind CSS (Standard CSS)

If you are not using Tailwind CSS, you can import the default stylesheet and set the `styling` prop to `"css"`.

```tsx
import OnlinePay from 'onlinepay-react';
import 'onlinepay-react/dist/onlinepay.css';

function MyCheckoutPage() {
  return (
    <OnlinePay
      styling='css'
      publicKey='YOUR_BASE64_ENCODED_PUBLIC_KEY'
      onSubmitPayment={(encryptedCard) => {
        console.log('Encrypted card:', encryptedCard);
        // Send to your server
      }}
      onError={({ field }) => console.log(`Error in field: ${field}`)}
    />
  );
}
```

## Props

| Prop                | Type                                | Description                                                             | Default                 |
| ------------------- | ----------------------------------- | ----------------------------------------------------------------------- | ----------------------- |
| `onSubmitPayment`   | `(encryptedCard: string) => void`   | **Required.** Callback function when payment is submitted successfully. | -                       |
| `publicKey`         | `string`                            | **Required.** Base64 encoded public key for encryption.                 | -                       |
| `onError`           | `(args: { field: string }) => void` | **Required.** Callback for validation errors as the user types.         | -                       |
| `onEncryptError`    | `(error: Error) => void`            | Optional callback for errors during the encryption process.             | -                       |
| `onCardBrandChange` | `(brand: string) => void`           | Optional callback that fires when the card brand is detected.           | -                       |
| `styling`           | `'tailwind' \| 'css'`               | Sets the styling mode. Use `'css'` for the default stylesheet.          | `'tailwind'`            |
| `headingText`       | `string`                            | Text for the main heading of the form.                                  | `'Credit Card Payment'` |
| `cardLabel`         | `string`                            | Label for the card number input.                                        | `'Card Number'`         |
| `expiryLabel`       | `string`                            | Label for the expiry date input.                                        | `'Expiry Date (MM/YY)'` |
| `cvvLabel`          | `string`                            | Label for the CVV input.                                                | `'CVV'`                 |
| `payButtonLabel`    | `string`                            | Text for the submit button.                                             | `'Pay Now'`             |
| `classes`           | `OnlinePayClasses`                  | An object to override default classes for deep customisation.           | `{}`                    |

## Advanced Customisation

You can override the classes for any part of the component by passing a `classes` object. This works for both `tailwind` and `css` styling modes.

For example, to change the button color in a Tailwind project:

```tsx
<OnlinePay
  classes={{
    button: 'w-full bg-green-600 hover:bg-green-700 text-white ...',
  }}
  // ... other props
/>
```
