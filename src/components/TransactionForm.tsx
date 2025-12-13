"use client";

import { useState } from "react";

interface TransactionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function TransactionForm({
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    vendorName: "",
    amount: "",
  });
  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.vendorName.trim())
      newErrors.vendorName = "Vendor name is required";
    if (!formData.amount) newErrors.amount = "Amount is required";
    else if (
      isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      newErrors.amount = "Amount must be a positive number";
    }
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
      setFormData({ vendorName: "", amount: "" });
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        Add New Transaction
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vendor Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Vendor Name
          </label>
          <input
            type="text"
            name="vendorName"
            value={formData.vendorName}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
              errors.vendorName
                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-blue-500"
            }`}
            placeholder="e.g., Amazon, Starbucks, Uber"
          />
          {errors.vendorName && (
            <p className="text-red-500 text-sm mt-1">{errors.vendorName}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Amount Paid ($)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
              errors.amount
                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-blue-500"
            }`}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Submit Transaction
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
