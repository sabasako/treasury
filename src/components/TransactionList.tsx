"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Transaction } from "./Dashboard";
import { ArrowUpCircle, ArrowDownCircle, User } from "lucide-react";
import { motion } from "motion/react";

interface TransactionListProps {
  transactions: Transaction[];
  currentUsername: string;
}

export function TransactionList({
  transactions,
  currentUsername,
}: TransactionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transfers</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet. Send your first transfer above.
            </p>
          ) : (
            transactions.map((tx, index) => {
              const isExpense = tx.senderUsername === currentUsername;
              const counterparty = isExpense
                ? tx.receiverUsername
                : tx.senderUsername;

              return (
                <motion.div
                  key={tx.id}
                  initial={{
                    opacity: 0,
                    x: tx.isAnimated ? (isExpense ? -30 : 30) : 0,
                  }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-slate-100 text-slate-700">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{counterparty}</p>
                      <p className="text-sm text-muted-foreground">
                        {tx.timestamp.toLocaleString()} • {tx.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        isExpense ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isExpense ? "-" : "+"}${tx.amount.toFixed(2)}
                    </span>
                    {isExpense ? (
                      <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
