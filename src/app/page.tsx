"use client";
import { useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { Dashboard } from "../components/Dashboard";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";

// decode JWT to extract payload
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

interface User {
  name: string;
  email: string;
  username: string; // frontend-friendly username (from JWT)
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (username: string, password: string) => {
    // Send login request in AuthForm (already storing token)
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = parseJwt(token);
    if (!payload) {
      toast.error("Invalid token");
      return;
    }

    // Extract name/username from claims (adjust claim key as per your JWT)
    const nameFromToken =
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
    const usernameFromToken =
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    setUser({
      name: nameFromToken ?? username,
      email: username,
      username: usernameFromToken ?? username,
    });

    toast.success("Welcome back!");
  };

  const handleRegister = (email: string, password: string, name: string) => {
    setUser({
      name,
      email,
      username: name, // default to full name
    });
    toast.success("Account created successfully!");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
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
