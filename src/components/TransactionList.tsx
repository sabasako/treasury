"use client";

import { useState } from "react";

interface Transaction {
  id: number;
  vendorName: string;
  amount: string | number;
  date: string;
  status: "pending" | "completed";
}

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: number) => void;
  animatingId: number | null;
  isVault?: boolean;
}

export default function TransactionList({
  transactions,
  onDelete,
  animatingId,
  isVault = false,
}: TransactionListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className={`
            bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700
            transition-all duration-300 transform hover:shadow-lg
            ${
              animatingId === transaction.id
                ? "animate-bounce-in animate-pulse-glow"
                : ""
            }
            ${expandedId === transaction.id ? "ring-2 ring-blue-500" : ""}
          `}
        >
          {/* Compact View */}
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded transition-colors"
            onClick={() =>
              setExpandedId(
                expandedId === transaction.id ? null : transaction.id
              )
            }
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-300 font-bold">
                    $
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {transaction.vendorName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {transaction.date}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                +${parseFloat(String(transaction.amount)).toFixed(2)}
              </p>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  transaction.status === "pending"
                    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                    : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                }`}
              >
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Expanded View */}
          {expandedId === transaction.id && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-slide-up">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Vendor
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {transaction.vendorName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Amount
                  </p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    ${parseFloat(String(transaction.amount)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Date
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {transaction.date}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Status
                  </p>
                  <span
                    className={`inline-block text-xs font-semibold px-3 py-1 rounded ${
                      transaction.status === "pending"
                        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                        : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    }`}
                  >
                    {transaction.status.charAt(0).toUpperCase() +
                      transaction.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Delete Button */}
              {!isVault && (
                <button
                  onClick={() => {
                    onDelete(transaction.id);
                    setExpandedId(null);
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  Delete Transaction
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
