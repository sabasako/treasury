"use client";

import { useState, useEffect } from "react";
import VaultRender from "@/components/vault/VaultRender";

export interface PendingAnimationTransaction {
  id: number;
  senderUsername: string;
  receiverUsername: string;
  amount: number;
  isAnimated: boolean;
  timestamp: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  balance: number;
  role: string;
}

export default function VaultPage() {
  const [data, setData] = useState<PendingAnimationTransaction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found. Please log in.");
          setLoading(false);
          return;
        }

        // Fetch user data
        const userRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/Auth/me`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!userRes.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await userRes.json();
        setUser(userData);

        // Fetch pending animations
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/Transaction/pending-animations`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const transactionsData = await res.json();
        setData(transactionsData);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vault...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-sm text-gray-500 mt-2">
            Please log in to view the vault.
          </p>
        </div>
      </div>
    );
  }

  const notAnimatedTransactions = data
    .filter((item) => !item.isAnimated && item.senderUsername === user.userName)
    .reverse();

  console.log(notAnimatedTransactions);

  return (
    <VaultRender
      pricePerBar={30}
      notAnimatedTransactions={notAnimatedTransactions}
      user={user}
    />
  );
}
