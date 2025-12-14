"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plus, CheckCircle2 } from "lucide-react";

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
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiver || !amount) return;

    await onAddTransaction({
      receiverUsername: receiver,
      amount: Number(amount),
      isAnimated: false,
    });

    setShowSuccess(true);
    setReceiver("");
    setAmount("");

    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <CardTitle>Send Money</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Receiver name</Label>
            <Input
              placeholder="McDonalds / HolyCrusad"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              required
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
            />
          </div>

          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Send Money
          </Button>
        </form>
      </CardContent>

      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-green-500/95 flex items-center justify-center"
        >
          <CheckCircle2 className="h-24 w-24 text-white" />
        </motion.div>
      )}
    </Card>
  );
}
