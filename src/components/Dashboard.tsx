"use client";

import { useState, useRef, useEffect } from "react";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function Dashboard({
  user: initialUser,
  onLogout,
}: DashboardProps) {
  const [user, setUser] = useState(initialUser);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "vault">(
    "dashboard"
  );
  const [animatingTransactionId, setAnimatingTransactionId] = useState<
    number | null
  >(null);

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  const handleAddTransaction = (transaction: any) => {
    const newTransaction = {
      id: Date.now(),
      ...transaction,
      date: new Date().toLocaleDateString(),
      status: "pending",
    };

    setAnimatingTransactionId(newTransaction.id);

    setUser((prevUser: any) => ({
      ...prevUser,
      balance: prevUser.balance + parseFloat(transaction.amount),
      transactions: [newTransaction, ...prevUser.transactions],
    }));

    // Remove animation after it completes
    setTimeout(() => {
      setAnimatingTransactionId(null);
    }, 1000);

    setShowForm(false);
  };

  const handleDeleteTransaction = (transactionId: number) => {
    const transaction = user.transactions.find(
      (t: any) => t.id === transactionId
    );
    if (transaction) {
      setUser((prevUser: any) => ({
        ...prevUser,
        balance: prevUser.balance - parseFloat(transaction.amount),
        transactions: prevUser.transactions.filter(
          (t: any) => t.id !== transactionId
        ),
      }));
    }
  };

  const pendingTransactions = user.transactions.filter(
    (t: any) => t.status === "pending"
  );
  const completedTransactions = user.transactions.filter(
    (t: any) => t.status === "completed"
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                TreasuAI
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Welcome, {user.name}!
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 text-white mb-8 animate-slide-up">
          <p className="text-blue-100 text-sm font-semibold mb-2">
            YOUR BALANCE
          </p>
          <h2 className="text-5xl font-bold mb-4">
            ${user.balance.toFixed(2)}
          </h2>
          <p className="text-blue-100">
            {user.transactions.length} transactions recorded
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`pb-4 px-4 font-semibold transition-all duration-200 ${
              activeTab === "dashboard"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            Dashboard ({pendingTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab("vault")}
            className={`pb-4 px-4 font-semibold transition-all duration-200 ${
              activeTab === "vault"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            Vault ({completedTransactions.length})
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            {/* Add Transaction Button */}
            <div className="mb-8">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                {showForm ? "✕ Close" : "+ Add Transaction"}
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <div className="mb-8 animate-slide-up">
                <TransactionForm
                  onSubmit={handleAddTransaction}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            )}

            {/* Transactions List */}
            <div>
              {pendingTransactions.length > 0 ? (
                <TransactionList
                  transactions={pendingTransactions}
                  onDelete={handleDeleteTransaction}
                  animatingId={animatingTransactionId}
                />
              ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                    No transactions yet
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                    Add a transaction to get started!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vault Tab */}
        {activeTab === "vault" && (
          <div>
            {completedTransactions.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Completed Transactions
                </h3>
                <TransactionList
                  transactions={completedTransactions}
                  onDelete={handleDeleteTransaction}
                  animatingId={null}
                  isVault={true}
                />
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Vault is empty
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  Completed transactions will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
