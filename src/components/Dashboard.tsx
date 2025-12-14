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
    username: string;
  };
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadDashboard = async () => {
    try {
      // Fetch user info for balance
      const me = await apiFetch("/api/Auth/me");
      if (!me || me.balance === undefined)
        throw new Error("Failed to fetch balance");
      setBalance(me.balance);

      // Fetch transaction history
      const txs = await apiFetch("/api/Transaction/history");
      if (!Array.isArray(txs)) throw new Error("Invalid transactions response");

      setTransactions(
        txs.map((t) => ({
          id: t.id,
          senderUsername: t.senderUsername,
          receiverUsername: t.receiverUsername,
          amount: t.amount,
          timestamp: new Date(t.timestamp),
          isAnimated: false,
          type: t.senderUsername === user.username ? "expense" : "income",
        }))
      );
    } catch (err) {
      console.error(err);
      onLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user.username]);

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

      // console.log(created);

      // ✅ Refresh all transactions from API after sending money
      await loadDashboard();

      // Navigate to vault page to see animation
      // router.push("/vault");
    } catch (err) {
      console.error("Error adding transaction:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl">Finance Tracker</h1>
            <p className="text-sm text-slate-600">Welcome back, {user.name}</p>
          </div>
          <div className="flex flex-row gap-2">
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            <Button variant="outline" onClick={() => router.push("/vault")}>
              <Wallet className="mr-2 h-4 w-4" />
              Vault
            </Button>
          </div>
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
              currentUsername={localStorage.getItem("username") || ""}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
