"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Wallet, TrendingUp } from "lucide-react";

import { apiFetch } from "../app/lib/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { TransactionList } from "./TransactionList";
import { AddTransactionForm } from "./AddTransactionForm";

export interface Transaction {
  id: number;
  senderUsername: string;
  receiverUsername: string;
  amount: number;
  timestamp: Date;
  isAnimated: boolean;
  type: "income" | "expense";
}

interface DashboardProps {
  user: {
    name: string;
    email: string;
    username: string; // used to detect income/expense
  };
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  console.log(user.username);
  // 🔹 Fetch transaction history
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await apiFetch("/api/Transaction/history");

        if (!Array.isArray(data)) throw new Error("Invalid API response");

        setTransactions(
          data.map((t: any) => {
            const isExpense = t.senderUsername === user.username;

            return {
              id: t.id,
              senderUsername: t.senderUsername,
              receiverUsername: t.receiverUsername,
              amount: t.amount,
              timestamp: new Date(t.timestamp),
              isAnimated: false,
              type: isExpense ? "expense" : "income",
            } as Transaction;
          })
        );
      } catch (err) {
        console.error("Failed to load transactions:", err);
        onLogout(); // token invalid or expired
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user.username, onLogout]);

  // 🔹 Add a transaction
  const handleAddTransaction = async (payload: {
    receiverUsername: string;
    amount: number;
    isAnimated: boolean;
  }) => {
    try {
      const created = await apiFetch("/api/Transaction/transfer", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!created || !created.id) {
        console.error("Transaction creation failed:", created);
        return;
      }

      const newTx: Transaction = {
        id: created.id,
        senderUsername: created.senderUsername,
        receiverUsername: created.receiverUsername,
        amount: created.amount,
        timestamp: new Date(created.timestamp),
        isAnimated: true,
        type: created.senderUsername === user.username ? "expense" : "income",
      };

      setTransactions((prev) => [newTx, ...prev]);
    } catch (err) {
      console.error("Error adding transaction:", err);
    }
  };

  const balance = transactions.reduce(
    (acc, t) =>
      t.senderUsername === user.username ? acc - t.amount : acc + t.amount,
    0
  );

  if (loading) return <div className="p-8">Loading transactions...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl">Finance Tracker</h1>
            <p className="text-sm text-slate-600">Welcome back, {user.name}</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="flex justify-between flex-row pb-2">
              <CardTitle className="text-sm">Current Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">${balance.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between flex-row pb-2">
              <CardTitle className="text-sm">Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{transactions.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <AddTransactionForm onAddTransaction={handleAddTransaction} />
            <TransactionList
              transactions={transactions}
              currentUsername={user.username}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
