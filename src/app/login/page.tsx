"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = data.redirect;
      } else {
        alert(data.error || "Login failed");
      }
    } catch {
      alert("An error occurred during login.");
    }
  };

  return (
    <div className="loginContainer">
      <div className="backgroundOverlay"></div>
      
      <div className="loginCard">
        <header className="loginHeader">
          <div className="logoWrapper">
            <Image
              src="/Visayas Medical.png"
              alt="VisayasMed Logo"
              width={90}
              height={90}
              className="brandLogo"
              priority
            />
          </div>
          <div className="brandInfo">
            <h1 className="brandName">VISAYASMED HOSPITAL</h1>
            <p className="groupAffiliation">A MEMBER OF APPLEONE MEDICAL GROUP</p>
          </div>
          <div className="contactDetails">
            <p>85 Osmeña Blvd., Brgy. Sta. Cruz, Cebu City, Philippines 6000</p>
            <p>Tel: (032) 253 1901 • www.visayasmedcebu.com.ph</p>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label htmlFor="email">EMAIL ADDRESS</label>
            <input
              id="email"
              type="email"
              placeholder="aljon.montecalvo08@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              suppressHydrationWarning
            />
          </div>

          <div className="formGroup">
            <label htmlFor="password">PASSWORD</label>
            <div className="passwordWrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                suppressHydrationWarning
              />
              <button
                type="button"
                className="passwordToggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                suppressHydrationWarning
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="optionsRow">
            <label className="rememberMe">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            <a href="#" className="forgotPassword">
              Forgot Password?
            </a>
          </div>

          <button type="submit" className="loginBtn" suppressHydrationWarning>
            SIGN IN
          </button>
        </form>

        <div className="registerPrompt">
          Don&apos;t have an account yet?
          <span className="adminContact">
            Please contact VisayasMed Hospital Administrator
          </span>
        </div>
      </div>
    </div>
  );
}
