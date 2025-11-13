import * as react_jsx_runtime from 'react/jsx-runtime';

interface OnlinePayProps {
    onSubmitPayment: (encryptedCard: string) => void;
    onError: (args: {
        field: string;
    }) => void;
    publicKey: string;
}
declare const OnlinePay: ({ onSubmitPayment, onError, publicKey }: OnlinePayProps) => react_jsx_runtime.JSX.Element;

export { OnlinePay };
