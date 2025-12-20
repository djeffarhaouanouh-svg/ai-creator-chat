"use client";

import { useEffect, useRef } from "react";

interface PaypalContentButtonProps {
  requestId: string;
  price: number;
  onPaymentSuccess: (orderId: string) => void;
  onError?: (error: string) => void;
}

export default function PaypalContentButton({
  requestId,
  price,
  onPaymentSuccess,
  onError,
}: PaypalContentButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonRendered = useRef(false);

  useEffect(() => {
    if (!paypalRef.current || buttonRendered.current) return;

    buttonRendered.current = true;

    const script = document.createElement("script");
    script.src =
      "https://www.paypal.com/sdk/js?client-id=ASeBra7QwjUUSH1Os_b6B5mxf1Da0vwT1vSL9nusB9G-gF8lfuuU-_eWC9Js_WCqxye3LXsQxdS21Eak&currency=EUR";
    script.async = true;

    script.onload = () => {
      const win: any = window;

      if (win.paypal && paypalRef.current) {
        win.paypal
          .Buttons({
            createOrder: function (data: any, actions: any) {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      value: price.toFixed(2),
                      currency_code: "EUR",
                    },
                    description: "Contenu personnalisé",
                  },
                ],
              });
            },

            onApprove: async function (data: any, actions: any) {
              try {
                const details = await actions.order.capture();
                
                // Appeler l'API pour mettre à jour le statut de la demande
                const response = await fetch("/api/paypal/authorize-content", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    requestId,
                    paypalOrderId: data.orderID,
                    paypalPayerId: details.payer.payer_id,
                    amount: price,
                  }),
                });

                const result = await response.json();

                if (result.success) {
                  onPaymentSuccess(data.orderID);
                } else {
                  throw new Error(result.error || "Erreur lors du traitement du paiement");
                }
              } catch (error: any) {
                console.error("Erreur PayPal:", error);
                if (onError) {
                  onError(error.message || "Erreur lors du paiement");
                }
              }
            },

            onError: function (err: any) {
              console.error("Erreur PayPal:", err);
              if (onError) {
                onError("Erreur lors de l'initialisation du paiement PayPal");
              }
            },

            onCancel: function (data: any) {
              console.log("Paiement annulé:", data);
              if (onError) {
                onError("Paiement annulé");
              }
            },
          })
          .render(paypalRef.current);
      }
    };

    script.onerror = () => {
      console.error("Erreur lors du chargement du script PayPal");
      if (onError) {
        onError("Impossible de charger PayPal");
      }
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      buttonRendered.current = false;
    };
  }, [requestId, price, onPaymentSuccess, onError]);

  return <div ref={paypalRef} className="w-full"></div>;
}




