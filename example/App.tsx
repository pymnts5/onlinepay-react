import OnlinePay from '../src';
// import 'onlinepay-react/dist/onlinepay.css'; // Uncomment to use the default CSS file instead of Tailwind classes
import './index.css';

function App() {
  const handlePaymentSubmit = (encryptedCard: string) => {
    console.log('Encrypted card for payment:', encryptedCard);
    alert(encryptedCard);
  };

  interface PaymentError {
    field: string;
  }

  const handleError = ({ field }: PaymentError) => {
    if (field !== '') {
      console.log(`Error in field ${field}`);
    }
  };

  return (
    <div>
      <div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans'>
        <main className='flex min-h-screen w-full max-w-3xl flex-col items-center justify-between bg-white py-16 sm:items-start sm:px-16 sm:py-32'>
          <OnlinePay
            onSubmitPayment={handlePaymentSubmit}
            onError={handleError}
            publicKey={import.meta.env.VITE_PGP_PUBLIC_KEY}
            // The component uses Tailwind classes by default (`styling="tailwind"`).
            // To use the default CSS file, import it and set the styling prop:
            // import 'onlinepay-react/dist/onlinepay.css';
            styling='tailwind' // or 'css' to use default styling
          />
        </main>
      </div>
    </div>
  );
}

export default App;
