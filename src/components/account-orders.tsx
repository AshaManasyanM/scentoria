"use client";

import { CartBagIcon } from "@/components/account-empty-state";
import { formatExactMoney } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

type OrderRow = {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  total: { amount: string; currencyCode: string };
  itemCount: number;
};

function statusLabel(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(kind: "pay" | "ship", value: string) {
  const key = value.toUpperCase();
  if (kind === "pay") {
    if (key.includes("PAID") || key.includes("AUTHORIZED")) return "bg-[#e8f5ee] text-[#1f7a4d]";
    if (key.includes("PENDING") || key.includes("PARTIAL")) return "bg-[#f7f0e2] text-[#8a6a2f]";
    if (key.includes("REFUND") || key.includes("VOID") || key.includes("FAIL")) return "bg-[#f8e8e8] text-[#9a3b3b]";
  }
  if (kind === "ship") {
    if (key.includes("FULFILLED")) return "bg-[#e8f5ee] text-[#1f7a4d]";
    if (key.includes("PARTIAL") || key.includes("IN_PROGRESS") || key.includes("ON_HOLD")) return "bg-[#f7f0e2] text-[#8a6a2f]";
    if (key.includes("RESTOCK") || key.includes("CANCEL")) return "bg-[#f8e8e8] text-[#9a3b3b]";
  }
  return "bg-[#f1ece4] text-[#5c564f]";
}

export function AccountOrders({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetch("/api/account/orders")
      .then(async (response) => {
        const data = (await response.json()) as { ok?: boolean; orders?: OrderRow[] };
        if (!alive) return;
        if (!response.ok || !data.ok) {
          setError(true);
          setOrders([]);
          return;
        }
        setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setError(true);
        setOrders([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <p className="px-4 py-10 text-center text-sm text-[#6b7280]">…</p>;
  }

  if (error) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center">
        <p className="text-[15px] text-[#083534]">{t.ordersUnavailable}</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center">
        <CartBagIcon className="h-14 w-14 text-[#9a9188]" />
        <h1 className="mt-5 text-lg font-medium text-[#111]">{t.emptyOrders}</h1>
        <Link href={path(locale, "/products")} className="mt-2 text-sm text-[#6b7280]">
          {t.emptyOrdersHint}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-medium text-[#111]">{t.orders}</h1>
      <ul className="space-y-3">
        {orders.map((order) => {
          const date = order.processedAt
            ? new Date(order.processedAt).toLocaleDateString(locale === "hy" ? "hy-AM" : locale === "es" ? "es" : "en-GB", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "";
          return (
            <li key={order.id} className="rounded-xl border border-[#e6e6e6] bg-white px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#083534]">{order.name}</p>
                  {date ? <p className="mt-1 text-xs text-[#6b7280]">{date}</p> : null}
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {order.itemCount} {t.orderItems}
                  </p>
                </div>
                <p className="text-sm font-medium text-[#083534]">{formatExactMoney(order.total)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone("pay", order.financialStatus)}`}>
                  {t.orderPayment}: {statusLabel(order.financialStatus)}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone("ship", order.fulfillmentStatus)}`}>
                  {t.orderFulfillment}: {statusLabel(order.fulfillmentStatus)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
