"use client";

import { useEffect } from "react";
import { useCart } from "@/app/_components/Cart/CartContext";

export function ClearCart() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}