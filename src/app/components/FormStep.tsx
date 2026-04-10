"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

interface FormStepProps {
  title: string;
  description?: string;
  Icon?: LucideIcon;
  children: React.ReactNode;
}

export default function FormStep({ title, description, Icon, children }: FormStepProps) {
  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100">
              <Icon className="w-6 h-6 text-[#3b67a1]" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">
              {title}
            </h2>
            {description && (
              <p className="text-sm font-medium text-slate-500 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">{children}</div>
    </div>
  );
}
