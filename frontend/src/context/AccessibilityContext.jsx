import React, { createContext, useContext } from "react";
import { useAccessibility } from "../hooks/useAccessibility";

const Ctx = createContext(null);

export function AccessibilityProvider({ children }) {
  return <Ctx.Provider value={useAccessibility()}>{children}</Ctx.Provider>;
}

export function useA11y() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useA11y must be inside <AccessibilityProvider>");
  return ctx;
}