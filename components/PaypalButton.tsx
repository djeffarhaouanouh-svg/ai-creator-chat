"use client";

import { useEffect } from "react";

export default function PaypalButton() {
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
                    amount: { value: "4.97" },
                  },
                ],
              });
            },

            onApprove: function (data: any, actions: any) {
              return actions.order.capture().then(function (details: any) {
                localStorage.setItem("subscribed", "yes");
                window.location.reload();
              });
            },
          })
          .render("#paypal-btn");
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="paypal-btn"></div>;
}
