"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputFieldProps {
  label: string;
  name: string;
  value: string | number | boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: "text" | "number" | "date" | "tel" | "email" | "password";
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  min?: string;
  isReadOnly?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
  className?: string;
  isReadOnly?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CheckboxFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  className?: string;
}

export function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  error,
  className = "",
  min,
  isReadOnly = false,
  icon: Icon,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={name} className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5 ml-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          type={currentType}
          name={name}
          value={typeof value === "boolean" ? "" : String(value)}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          readOnly={isReadOnly}
          suppressHydrationWarning={true}
          className={`
            w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white
            border-2 border-slate-300 rounded-xl outline-none
            transition-all duration-200
            placeholder:text-slate-400
            ${error ? "border-red-200 bg-red-50/30" : "hover:border-slate-400 focus:border-[#3b67a1] focus:ring-4 focus:ring-blue-100"}
            ${isReadOnly ? "bg-slate-50/50 text-slate-500 cursor-not-allowed border-slate-200" : ""}
            ${isPassword && !isReadOnly ? "pr-12" : ""}
          `}
        />
        {isPassword && !isReadOnly && (
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-red-500 font-bold ml-1 mt-0.5 uppercase tracking-wide">{error}</p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  error,
  className = "",
  isReadOnly = false,
  icon: Icon,
}: SelectFieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={name} className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5 ml-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={isReadOnly}
          suppressHydrationWarning={true}
          className={`
            w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white
            border-2 border-slate-100 rounded-xl outline-none appearance-none
            transition-all duration-200
            ${error ? "border-red-200 bg-red-50/30" : "hover:border-slate-200 focus:border-[#3b67a1] focus:ring-4 focus:ring-blue-100"}
            ${isReadOnly ? "bg-slate-50/50 text-slate-500 cursor-not-allowed border-slate-100" : ""}
          `}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-[11px] text-red-500 font-bold ml-1 mt-0.5 uppercase tracking-wide">{error}</p>
      )}
    </div>
  );
}

export function CheckboxField({
  label,
  name,
  checked,
  onChange,
  className = "",
}: CheckboxFieldProps) {
  return (
    <label
      className={`
        flex items-center gap-3 cursor-pointer py-3.5 px-5 rounded-xl border-2
        transition-all duration-200 group
        ${checked 
          ? "bg-blue-50/50 border-blue-200" 
          : "bg-white border-slate-300 hover:border-slate-400"
        } 
        ${className}
      `}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          suppressHydrationWarning={true}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 transition-all checked:border-[#3b67a1] checked:bg-[#3b67a1]"
        />
        <svg
          className="absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className={`text-sm font-bold transition-colors ${checked ? "text-[#1e3a5f]" : "text-slate-600 group-hover:text-slate-800"}`}>
        {label}
      </span>
    </label>
  );
}
