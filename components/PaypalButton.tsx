"use client";
declare global {
  interface Window {
    paypal: any;
  }
}

import { useEffect, useRef } from "react";

export default function PaypalButton() {
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://www.paypal.com/sdk/js?client-id=AeyalIbLeWmq5yoMLrWtZ-rmF2VzVf5_tL2tAyZScUOMhCB7b59A-pxhRvmJKEDuOQz-MH2TM-JdCi7p&vault=true&intent=subscription&currency=EUR";
    script.async = true;

    script.onload = () => {
      if (window.paypal && paypalRef.current) {
        window.paypal.Buttons({
          style: {
            shape: "pill",
            color: "gold",
            layout: "vertical",
            label: "subscribe",
          },

          createSubscription: (data: any, actions: any) => {
            return actions.subscription.create({
              plan_id: "P-4CJI44O0GG396443MNETUCHA",
            });
          },

          onApprove: (data: any) => {
            alert("Abonnement créé : " + data.subscriptionID);
          }

        }).render(paypalRef.current);
      }
    };

    document.body.appendChild(script);
  }, []);

  return <div ref={paypalRef}></div>;
}
