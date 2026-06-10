"use client";

import { useEffect } from "react";

import { startKakaoPayProPass } from "@/lib/membership";

type RepeatPaymentOnRefreshProps = {
  orderId?: string;
};

export function RepeatPaymentOnRefresh({ orderId }: RepeatPaymentOnRefreshProps) {
  useEffect(() => {
    if (!orderId) {
      return;
    }

    const enabled = process.env.NEXT_PUBLIC_KAKAOPAY_DEMO_REPEAT_ON_SUCCESS !== "false";
    if (!enabled) {
      return;
    }

    const storageKey = `careerlens:kakaopay-success-seen:${orderId}`;
    const alreadySeen = window.sessionStorage.getItem(storageKey) === "true";

    if (!alreadySeen) {
      window.sessionStorage.setItem(storageKey, "true");
      return;
    }

    let canceled = false;

    startKakaoPayProPass()
      .then((response) => {
        if (!canceled) {
          window.location.href = response.redirect_url;
        }
      })
      .catch(() => {
        // Demo-only failure path: keep the normal success screen visible.
      });

    return () => {
      canceled = true;
    };
  }, [orderId]);

  return null;
}
