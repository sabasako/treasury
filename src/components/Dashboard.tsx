import { useState } from "react";
import { TransactionList } from "./TransactionList";
import { AddTransactionForm } from "./AddTransactionForm";
import { AIAnalyzer } from "./AIAnalyzer";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { LogOut, Wallet, TrendingUp } from "lucide-react";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  type: "income" | "expense";
}

interface DashboardProps {
  user: { name: string; email: string };
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      description: "Morning Coffee",
      amount: 5.5,
      category: "coffee",
      date: new Date("2024-12-10"),
      type: "expense",
    },
    {
      id: "2",
      description: "Salary",
      amount: 3000,
      category: "income",
      date: new Date("2024-12-01"),
      type: "income",
    },
    {
      id: "3",
      description: "Starbucks",
      amount: 6.75,
      category: "coffee",
      date: new Date("2024-12-11"),
      type: "expense",
    },
  ]);

  const balance = transactions.reduce((acc, t) => {
    return t.type === "income" ? acc + t.amount : acc - t.amount;
  }, 0);

  const handleAddTransaction = (
    transaction: Omit<Transaction, "id" | "date">
  ) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      date: new Date(),
    };
    setTransactions([newTransaction, ...transactions]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl">Finance Tracker</h1>
              <p className="text-sm text-slate-600">
                Welcome back, {user.name}
              </p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Current Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">${balance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total across all transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{transactions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {transactions.filter((t) => t.type === "income").length} income,{" "}
                {transactions.filter((t) => t.type === "expense").length}{" "}
                expenses
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            {/* <TabsTrigger value="analyzer">AI Analyzer</TabsTrigger> */}
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <AddTransactionForm onAddTransaction={handleAddTransaction} />
            <TransactionList transactions={transactions} />
          </TabsContent>

          <TabsContent value="analyzer">
            <AIAnalyzer transactions={transactions} currentBalance={balance} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
