import './index.css';
interface OnlinePayProps {
    onSubmitPayment: (encryptedCard: string) => void;
    onError: (args: {
        field: string;
    }) => void;
    publicKey: string;
}
declare const OnlinePay: ({ onSubmitPayment, onError, publicKey }: OnlinePayProps) => import("react/jsx-runtime").JSX.Element;
export default OnlinePay;
