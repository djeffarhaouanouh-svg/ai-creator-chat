"use client";

import { useEffect } from "react";
import { storage } from "@/lib/storage";

interface PaypalButtonProps {
  creatorId: string;
  price: number;
}

export default function PaypalButton({ creatorId, price }: PaypalButtonProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://www.paypal.com/sdk/js?client-id=ASeBra7QwjUUSH1Os_b6B5mxf1Da0vwT1vSL9nusB9G-gF8lfuuU-_eWC9Js_WCqxye3LXsQxdS21Eak&currency=EUR";
    script.async = true;

    script.onload = () => {
      const win: any = window;

          if (win.paypal) {
              win.paypal
          .Buttons({
            createOrder: function (data: any, actions: any) {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: { value: price.toFixed(2) },
                  },
                ],
              });
            },

            onApprove: async function (data: any, actions: any) {
              return actions.order.capture().then(async function (details: any) {
                // Récupérer l'userId depuis localStorage
                const userId = localStorage.getItem('userId');

                if (!userId) {
                  alert("Erreur : utilisateur non connecté");
                  return;
                }

                try {
                  // Créer l'abonnement en base de données
                  const response = await fetch('/api/subscriptions/create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      userId,
                      creatorSlug: creatorId,
                      paypalOrderId: data.orderID,
                      amount: price
                    }),
                  });

                  const result = await response.json();

                  if (result.success) {
                    // Synchroniser avec localStorage
                    storage.subscribe(creatorId);

                    // Rediriger vers le chat
                    window.location.href = `/chat/${creatorId}`;
                  } else {
                    alert("Erreur lors de la création de l'abonnement : " + result.error);
                  }
                } catch (error) {
                  console.error("Erreur:", error);
                  alert("Erreur lors de la création de l'abonnement");
                }
              });
            },

            onError: function (err: any) {
              console.error("Erreur PayPal:", err);
              // Ne pas afficher d'alerte automatiquement, juste logger l'erreur
            }
          })
          .render("#paypal-btn");
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [creatorId, price]);

  return <div id="paypal-btn"></div>;
}
