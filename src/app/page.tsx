"use client";
import { useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { Dashboard } from "../components/Dashboard";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";

interface User {
  name: string;
  email: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (email: string, password: string) => {
    // Mock login - in production this would validate against a backend
    setUser({
      name: email.split("@")[0],
      email,
    });
    toast.success("Welcome back!");
  };

  const handleRegister = (email: string, password: string, name: string) => {
    // Mock registration - in production this would create a user in the backend
    setUser({
      name,
      email,
    });
    toast.success("Account created successfully!");
  };

  const handleLogout = () => {
    setUser(null);
    toast.info("Logged out successfully");
  };

  return (
    <>
      {!user ? (
        <AuthForm onLogin={handleLogin} onRegister={handleRegister} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
      <Toaster />
    </>
  );
}
