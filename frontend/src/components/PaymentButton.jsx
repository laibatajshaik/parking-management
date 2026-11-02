import { useState } from "react";
import { API_BASE_URL, apiFetch } from "../config/api.js";
import { CreditCard } from "lucide-react";

const checkoutScriptUrl = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve();
  }
  const existingScript = document.querySelector(`script[src="${checkoutScriptUrl}"]`);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = checkoutScriptUrl;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}

async function postJson(path, body) {
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "The payment request could not be completed.");
  }
  return data;
}

export default function PaymentButton({ session, onPrepareOrder, onPaymentComplete, disabled = false }) {
  const [isOpening, setIsOpening] = useState(false);
  const [paymentState, setPaymentState] = useState(null);
  const [verificationData, setVerificationData] = useState(null);

  const verifyPayment = async (result) => {
    setIsOpening(true);
    try {
      const verification = await postJson("/api/customer/payments/razorpay/verify", {
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature
      });
      if (verification.paymentStatus === "Completed") {
        setPaymentState({ status: "success", message: "Payment confirmed. Your receipt is available in Digital Receipts." });
        setVerificationData(null);
        try {
          await onPaymentComplete?.(verification);
        } catch {
          setPaymentState({ status: "success", message: "Payment confirmed. Refresh My Parking Payments to see your receipt." });
        }
      } else if (verification.paymentStatus === "Failed") {
        setPaymentState({ status: "failure", message: "Razorpay reported that this payment failed." });
        setVerificationData(null);
      } else {
        setPaymentState({ status: "pending", message: "Payment confirmation is pending. You can retry verification shortly." });
        setVerificationData(result);
      }
    } catch (error) {
      setPaymentState({ status: "pending", message: `Payment was submitted, but confirmation is pending: ${error.message}` });
      setVerificationData(result);
    } finally {
      setIsOpening(false);
    }
  };

  const startCheckout = async () => {
    if (isOpening || disabled || (!session?.parking_session_id && !onPrepareOrder)) {
      return;
    }
    setIsOpening(true);
    setPaymentState(null);
    setVerificationData(null);
    try {
      await loadRazorpayCheckout();
      const orderRequest = session?.parking_session_id
        ? { parking_session_id: session.parking_session_id }
        : await onPrepareOrder();
      const order = await postJson("/api/customer/payments/razorpay/order", orderRequest);
      let checkoutSettled = false;
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Shnoor Parking",
        description: session?.vehicle_number
          ? `Parking fee for ${session.vehicle_number}`
          : "Parking reservation",
        order_id: order.orderId,
        prefill: {
          name: session?.owner_name || "",
          email: session?.owner_email || ""
        },
        theme: { color: "#0d9488" },
        handler: async (result) => {
          checkoutSettled = true;
          await verifyPayment(result);
        },
        modal: {
          ondismiss: async () => {
            if (checkoutSettled) {
              return;
            }
            checkoutSettled = true;
            try {
              const result = await postJson("/api/customer/payments/razorpay/cancel", {
                razorpay_order_id: order.orderId
              });
              setPaymentState(result.paymentStatus === "Cancelled"
                ? { status: "cancelled", message: "Checkout was cancelled. No payment was confirmed." }
                : { status: "pending", message: "Payment status is still pending. Refresh the payment list before retrying." });
            } catch (error) {
              setPaymentState({ status: "pending", message: `Checkout closed; payment status could not be confirmed: ${error.message}` });
            } finally {
              setIsOpening(false);
            }
          }
        }
      });
      checkout.on("payment.failed", async (event) => {
        checkoutSettled = true;
        const paymentId = event.error?.metadata?.payment_id;
        try {
          if (paymentId) {
            const result = await postJson("/api/customer/payments/razorpay/failure", {
              razorpay_order_id: order.orderId,
              razorpay_payment_id: paymentId
            });
            setPaymentState(result.paymentStatus === "Failed"
              ? { status: "failure", message: "Razorpay reported that this payment failed. You can try again." }
              : { status: "pending", message: "Razorpay has not confirmed the final payment status yet." });
          } else {
            setPaymentState({ status: "pending", message: "Razorpay has not provided a final payment status yet." });
          }
        } catch (error) {
          setPaymentState({ status: "pending", message: `Payment status could not be confirmed: ${error.message}` });
        } finally {
          setIsOpening(false);
        }
      });
      checkout.open();
    } catch (error) {
      setPaymentState({ status: "failure", message: error.message });
      setIsOpening(false);
    }
  };

  const statusColor = paymentState?.status === "success"
    ? "#047857"
    : paymentState?.status === "failure"
      ? "#b91c1c"
      : paymentState?.status === "cancelled"
        ? "#475569"
        : "#92400e";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
      <button
        type="button"
        className="pw-btn-primary"
        onClick={startCheckout}
        disabled={isOpening || disabled || (!session?.parking_session_id && !onPrepareOrder)}
        style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}
      >
        <CreditCard size={15} />
        <span>{isOpening ? "Opening checkout..." : "Pay Now"}</span>
      </button>
      {paymentState && (
        <span role="status" aria-live="polite" style={{ color: statusColor, fontSize: "0.82rem", fontWeight: 600 }}>
          {paymentState.message}
        </span>
      )}
      {paymentState?.status === "pending" && verificationData && (
        <button type="button" className="pw-btn-action-refresh" onClick={() => verifyPayment(verificationData)} disabled={isOpening}>
          <span>{isOpening ? "Verifying..." : "Retry Verification"}</span>
        </button>
      )}
    </div>
  );
}
