"use client";
import { useState, useEffect } from "react";
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
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const checkExistingToken = () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found in localStorage");
          setIsLoading(false);
          return;
        }

        const payload = parseJwt(token);
        if (!payload) {
          console.error("Failed to parse token");
          // Invalid token, remove it
          localStorage.removeItem("token");
          setIsLoading(false);
          return;
        }

        // Check if token is expired (with 5 minute buffer to avoid edge cases)
        const exp = payload.exp;
        if (exp) {
          const expirationTime = exp * 1000;
          const currentTime = Date.now();
          const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

          if (expirationTime < currentTime - bufferTime) {
            console.log("Token expired", {
              expirationTime: new Date(expirationTime).toISOString(),
              currentTime: new Date(currentTime).toISOString(),
            });
            // Token expired, remove it
            localStorage.removeItem("token");
            setIsLoading(false);
            return;
          }
        }

        // Extract user info from token
        const nameFromToken =
          payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        const usernameFromToken =
          payload[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
          ];
        const emailFromToken =
          payload[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
          ] || usernameFromToken;

        // Set user even if name/username are missing - token is valid
        // This prevents false logouts when token is valid but claims are missing
        setUser({
          name: nameFromToken || usernameFromToken || "User",
          email: emailFromToken || usernameFromToken || emailFromToken || "",
          username: usernameFromToken || nameFromToken || "user",
        });

        console.log("Token validated, user logged in", {
          hasName: !!nameFromToken,
          hasUsername: !!usernameFromToken,
        });
      } catch (error) {
        console.error("Error checking token:", error);
        // Only remove token on actual errors, not on missing claims
        if (error instanceof Error && error.message.includes("parse")) {
          localStorage.removeItem("token");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingToken();
  }, []);

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

  // Show loading state while checking token
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
