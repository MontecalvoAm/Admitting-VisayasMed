"use client";

import React from "react";
import { Check } from "lucide-react";

interface Step {
  label: string;
  shortLabel?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full px-4 sm:px-8">
      <div className="flex items-center justify-between relative">
        {steps.map((step: Step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <React.Fragment key={index}>
              {/* Step item */}
              <div className="flex items-center z-10 group">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      relative w-10 h-10 rounded-2xl flex items-center justify-center 
                      transition-all duration-500 ease-in-out cursor-default
                      ${isCompleted
                        ? "bg-[#3b67a1] text-white shadow-lg shadow-blue-900/20"
                        : isActive
                          ? "bg-white text-[#3b67a1] shadow-xl ring-2 ring-[#3b67a1]/20 scale-110"
                          : "bg-white text-slate-300 border border-slate-200"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" strokeWidth={3} />
                    ) : (
                      <span className="text-sm font-bold">{stepNumber}</span>
                    )}
                    
                    {/* Active glow */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl bg-[#3b67a1]/5 animate-ping opacity-20" />
                    )}
                  </div>
                  
                  <div className="absolute -bottom-7 flex flex-col items-center whitespace-nowrap">
                    <span
                      className={`
                        text-[11px] font-bold tracking-tight transition-colors duration-300
                        ${isActive ? "text-[#1e3a5f]" : isCompleted ? "text-slate-500" : "text-slate-400"}
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Advanced Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 h-1.5 bg-slate-100 rounded-full relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#3b67a1] to-[#416ba9] transition-all duration-700 ease-in-out"
                    style={{ width: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {/* Spacer for labels */}
      <div className="h-8" />
    </div>
  );
}
