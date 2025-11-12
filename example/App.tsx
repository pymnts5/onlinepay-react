import React from "react";
import OnlinePay from "../src/onlinepay";

function App() {
  const handlePaymentSubmit = (encryptedCard: string) => {
    console.log("Payment submitted with encrypted card:", encryptedCard);
    alert(encryptedCard);
  };

  interface PaymentError {
    field: string;
  }

  const handleError = ({ field }: PaymentError) => {
    if (field !== "") {
      console.log(`Error in field ${field}`);
    }
  };

  return (
    <div>
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
        <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white sm:items-start">
          <OnlinePay
            onSubmitPayment={handlePaymentSubmit}
            onError={handleError}
            publicKey={
              "LS0tLS1CRUdJTiBQR1AgUFVCTElDIEtFWSBCTE..."
            }
          />
        </main>
      </div>
    </div>
  );
}

export default App;
