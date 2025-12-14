"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface AddTransactionFormProps {
  onAddTransaction: (payload: {
    receiverUsername: string;
    amount: number;
    isAnimated: boolean;
  }) => Promise<void>;
}

export function AddTransactionForm({
  onAddTransaction,
}: AddTransactionFormProps) {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false); // 🔹 loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // prevent double click

    setLoading(true);
    try {
      await onAddTransaction({
        receiverUsername: receiver,
        amount: Number(amount),
        isAnimated: false,
      });

      toast.success("Payment recorded successfully!", {
        description: `$${Number(amount).toFixed(2)} to ${receiver}`,
      });

      setReceiver("");
      setAmount("");
    } catch (err) {
      console.error("Transaction failed:", err);
      toast.error("Failed to record payment", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setLoading(false); // 🔹 re-enable button
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Receiver name</Label>
            <Input
              placeholder="mcdonalds / kfc / heineken"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              required
              disabled={loading} // 🔹 disable while loading
            />
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading} // 🔹 disable while loading
            />
          </div>

          <Button className="w-full" disabled={loading}>
            {loading ? (
              "Recording..."
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Record Payment
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
