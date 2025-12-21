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
    console.log('🔍 PaypalContentButton useEffect:', { requestId, price, hasRef: !!paypalRef.current, rendered: buttonRendered.current });
    
    if (!paypalRef.current) {
      console.warn('⚠️ paypalRef.current is null');
      return;
    }
    
    if (buttonRendered.current) {
      console.log('⚠️ Button already rendered, skipping');
      return;
    }
    
    // Vérifier que le prix est valide
    const numericPrice = typeof price === 'number' ? price : parseFloat(String(price || '0'));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      console.error('Prix invalide pour PayPal:', price);
      if (onError) {
        onError('Prix invalide');
      }
      return;
    }

    buttonRendered.current = true;

    // Vérifier si le script PayPal existe déjà
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existingScript) {
      // Le script existe déjà, utiliser PayPal directement
      const win: any = window;
      if (win.paypal && paypalRef.current) {
        renderPaypalButton(win.paypal, numericPrice);
      }
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://www.paypal.com/sdk/js?client-id=ASeBra7QwjUUSH1Os_b6B5mxf1Da0vwT1vSL9nusB9G-gF8lfuuU-_eWC9Js_WCqxye3LXsQxdS21Eak&currency=EUR";
    script.async = true;

    script.onload = () => {
      const win: any = window;
      if (win.paypal && paypalRef.current) {
        renderPaypalButton(win.paypal, numericPrice);
      }
    };

    script.onerror = () => {
      console.error("Erreur lors du chargement du script PayPal");
      buttonRendered.current = false;
      if (onError) {
        onError("Impossible de charger PayPal");
      }
    };

    document.body.appendChild(script);

    function renderPaypalButton(paypal: any, finalPrice: number) {
      if (!paypalRef.current) return;
      
      paypal
        .Buttons({
          createOrder: function (data: any, actions: any) {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: finalPrice.toFixed(2),
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
                  amount: finalPrice,
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

    return () => {
      buttonRendered.current = false;
    };
  }, [requestId, price, onPaymentSuccess, onError]);

  return <div ref={paypalRef} className="w-full"></div>;
}







