"use client";
import { useShop } from "@/lib/store";

export default function Toast() {
  const { toast } = useShop();
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4 lg:bottom-6">
      {toast && <div key={toast.id} className={`animate-rise rounded-full px-5 py-3 text-sm shadow-soft ${toast.tone === "error" ? "bg-pink-dark text-white" : "bg-cocoa text-cream"}`}>{toast.message}</div>}
    </div>
  );
}
