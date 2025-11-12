# onlinepay-react

## Installation

npm install onlinepay-react

## Usage

```tsx
import { OnlinePay } from "onlinepay-react";
import "onlinepay-react/dist/onlinepay.css"; // Fallback CSS

<OnlinePay onSubmitPayment={() => console.log("Paid")} />;
```

## Tailwind support

The component uses tailwind and falls back to some default styling. If you project uses tailwind, simply add `onlinepay-react` to your `tailwind.config.js` config file:

```tsx
const config = {
  content: [
    "./index.html",
    "./main.tsx",
    "./App.tsx",
    "./node_modules/onlinepay-react/onlinepay.tsx",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```
