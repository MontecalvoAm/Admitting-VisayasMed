"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  User,
  Users,
  Phone,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Eye,
  Loader2,
  ClipboardCheck,
  X,
} from "lucide-react";
import StepIndicator from "./components/StepIndicator";
import FormStep from "./components/FormStep";
import { InputField, SelectField, CheckboxField } from "./components/InputField";
import PrintableForm from "./components/PrintableForm";
import Modal from "./components/Modal";
import { useStatusModal } from "./components/StatusModalContext";
 circular_dependency_warning: false

/* ─── Schema Types (mirrors /api/form-schema) ─── */
interface FieldOption {
  value: string;
  label: string;
}

interface SchemaField {
  id: string;
  label: string;
  name: string;
  type: "text" | "number" | "date" | "tel" | "email" | "select" | "checkbox";
  stepId: string;
  required: boolean;
  placeholder: string;
  options: FieldOption[];
}

interface SchemaStep {
  id: string;
  label: string;
  order: number;
}

interface FormSchema {
  id: number;
  schema_name: string;
  steps: SchemaStep[];
  fields: SchemaField[];
}

/* ─── Generic form state ─── */
type FormData = Record<string, string>;

/* ─── Helper Functions ─── */
function calculateAge(birthday: string): string {
  if (!birthday) return "";
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age.toString() : "0";
}

/* ─── Step icon map (by step order/position) ─── */
const STEP_ICONS = [User, Users, Phone, Eye];

/* ─── Review step detection ─── */
const REVIEW_STEP_LABELS = ["review", "information review", "summary", "confirm", "confirmation"];
function isReviewStep(step: SchemaStep): boolean {
  return REVIEW_STEP_LABELS.includes(step.label.toLowerCase());
}

/* ─── Main Component ─── */
export default function AdmittingForm() {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaError, setSchemaError] = useState(false);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { showSuccess, showError, setLoading: setGlobalLoading } = useStatusModal();

  /* ─── Fetch schema on mount ─── */
  useEffect(() => {
    let mounted = true;
    setSchemaLoading(true);
    fetch("/api/form-schema?name=patient-admission")
      .then(async (res) => {
        if (!mounted) return;
        if (!res.ok) throw new Error("Schema not found");
        const data: FormSchema = await res.json();
        // Sort steps by order
        data.steps = data.steps.sort((a, b) => a.order - b.order);
        setSchema(data);
        // Build initial formData from schema fields
        const initial: FormData = {};
        data.fields.forEach((f) => {
          if (f.type === "select" && f.options.length > 0) {
            initial[f.name] = f.options[0].value;
          } else {
            initial[f.name] = "";
          }
        });
        setFormData(initial);
      })
      .catch(() => {
        if (mounted) setSchemaError(true);
      })
      .finally(() => {
        if (mounted) setSchemaLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  /* ─── Derived values ─── */
  const steps = schema?.steps ?? [];
  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex];

  /* ─── Change handler ─── */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const newValue = type === "checkbox" ? String((e.target as HTMLInputElement).checked) : value;

      setFormData((prev) => {
        const updated = { ...prev, [name]: newValue };
        // Auto-calculate Age whenever Birthday changes
        if (name === "Birthday") {
          updated["Age"] = calculateAge(newValue);
        }
        return updated;
      });

      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [errors]
  );

  /* ─── Validation ─── */
  const validateFields = useCallback((stepId?: string): Record<string, string> => {
    if (!schema) return {};
    const stepErrors: Record<string, string> = {};
    const fieldsToValidate = stepId 
      ? schema.fields.filter((f) => f.stepId === stepId)
      : schema.fields;

    fieldsToValidate.forEach((f) => {
      if (f.required) {
        const val = (formData[f.name] ?? "").toString().trim();
        if (!val) {
          stepErrors[f.name] = `${f.label} is required`;
        }
      }
    });
    return stepErrors;
  }, [schema, formData]);

  const validateCurrentStep = useCallback(() => {
    if (!currentStep) return {};
    return validateFields(currentStep.id);
  }, [currentStep, validateFields]);

  /* ─── Navigation ─── */
  const handleNext = useCallback(() => {
    const stepErrors = validateCurrentStep();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      showError("Validation Error", "Please complete all required fields correctly before moving to the next step.");
      return;
    }
    setErrors({});
    setStatus("idle");
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [validateCurrentStep, totalSteps]);

  const handleBack = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    // 1. Validate ALL fields before final submission
    const allErrors = validateFields();
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      showError("Submission Blocked", "Some required fields are missing. We have navigated you to the first error. Please review all steps.");
      
      // Find the first field with an error and navigate to its step
      const firstErrorField = schema?.fields.find(f => allErrors[f.name]);
      if (firstErrorField) {
        const stepIndex = steps.findIndex(s => s.id === firstErrorField.stepId);
        if (stepIndex !== -1) {
          setCurrentStepIndex(stepIndex);
        }
      }
      return;
    }

    setStatus("submitting");
    try {
      const payload: Record<string, unknown> = { ...formData };
      if (formData["Age"]) payload["Age"] = parseInt(formData["Age"]);
      if (formData["Birthday"]) payload["Birthday"] = formData["Birthday"] || null;

      const res = await fetch("/api/admit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit form");
      
      showSuccess("Admission Successful", "The patient information has been successfully recorded in our system. You can now process another admission.");
      
      // Reset form
      if (schema) {
        const initial: FormData = {};
        schema.fields.forEach((f) => {
          if (f.type === "select" && f.options.length > 0) {
            initial[f.name] = f.options[0].value;
          } else {
            initial[f.name] = "";
          }
        });
        setFormData(initial);
      }
      setCurrentStepIndex(0);
      setErrors({});
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
      showError("Submission Failed", "Something went wrong while submitting the form. Please try again or contact support.");
    }
  };

  /* ─── Dynamic field renderer ─── */
  const renderDynamicField = (field: SchemaField) => {
    const commonProps = {
      label: field.label,
      name: field.name,
      required: field.required,
      error: errors[field.name],
    };

    if (field.type === "select") {
      return (
        <SelectField
          key={field.id}
          {...commonProps}
          value={(formData[field.name] as string) ?? ""}
          onChange={handleChange}
          options={field.options}
        />
      );
    }

    if (field.type === "checkbox") {
      return (
        <CheckboxField
          key={field.id}
          {...commonProps}
          checked={(formData[field.name] as string) === "true"}
          onChange={handleChange}
        />
      );
    }

    // All other types: text, number, date, tel, email
    return (
      <InputField
        key={field.id}
        {...commonProps}
        value={(formData[field.name] as string) ?? ""}
        onChange={handleChange}
        type={field.type as "text" | "number" | "date" | "tel" | "email"}
        placeholder={field.placeholder}
        // Age is auto-calculated from Birthday — make it read-only
        isReadOnly={field.name === "Age"}
      />
    );
  };

  /* ─── Render current step ─── */
  const renderStep = () => {
    if (!schema || !currentStep) return null;

    // Review/Summary step — show PrintableForm
    if (isReviewStep(currentStep)) {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="no-print mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-6 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Eye className="w-7 h-7 text-[#3b67a1]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight m-0">Information Review</h2>
              <p className="text-sm font-medium text-slate-500 m-0 mt-1">Please carefully review all details below before finalizing the admission.</p>
            </div>
          </div>
          <PrintableForm formData={formData as any} />
        </div>
      );
    }

    // Regular dynamic step
    const stepFields = schema.fields.filter((f) => f.stepId === currentStep.id);
    const StepIcon = STEP_ICONS[currentStepIndex] ?? User;

    // Determine step description based on position
    const descriptions: Record<number, string> = {
      0: "Enter the patient's personal details",
      1: "Provide information about the patient's family",
      2: "Emergency contact details and account responsibility",
    };

    return (
      <FormStep
        title={currentStep.label}
        description={descriptions[currentStepIndex] ?? "Fill in the required fields"}
        Icon={StepIcon}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 text-left">
          {stepFields.map((field) => renderDynamicField(field))}
        </div>
      </FormStep>
    );
  };

  /* ─── Step indicator labels ─── */
  const stepIndicatorData = steps.map((s) => ({
    label: s.label,
    shortLabel: s.label.split(" ")[0],
  }));

  /* ─── Loading state ─── */
  if (schemaLoading) {
    return (
      <div className="loginContainer">
        <div className="backgroundOverlay" />
        <div className="relative z-10 w-full flex items-center justify-center h-full">
          <div className="step-card p-10 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-[#3b67a1] animate-spin" />
            <p className="text-sm font-semibold text-[var(--neutral-500)]">Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Schema error state ─── */
  if (schemaError || !schema) {
    return (
      <div className="loginContainer">
        <div className="backgroundOverlay" />
        <div className="relative z-10 w-full flex items-center justify-center h-full">
          <div className="step-card p-10 flex flex-col items-center gap-4 text-center max-w-md">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <h2 className="text-lg font-bold text-[var(--neutral-900)]">Form Unavailable</h2>
            <p className="text-sm text-[var(--neutral-500)]">
              The admission form configuration could not be loaded. Please contact an administrator to configure
              the form at <strong>Dashboard → Manage Forms</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }


  /* ─── Main Render ─── */
  return (
    <div className="loginContainer">
      {/* Background Overlay */}
      <div className="backgroundOverlay" />

      <div className="wizard-container">
        {/* Header: Step Indicator */}
        <header className="wizard-header">
          <div className="max-w-4xl mx-auto">
            <StepIndicator steps={stepIndicatorData} currentStep={currentStepIndex + 1} />
          </div>
        </header>

        {/* Content Area: Scrollable */}
        <main className="wizard-content custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            {/* Active Step Content */}
            <div key={currentStepIndex} className="min-h-0">
              {renderStep()}
            </div>
          </div>
        </main>

        {/* Footer: Navigation Buttons */}
        <footer className="wizard-footer">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                suppressHydrationWarning={true}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                  text-slate-600 bg-white border border-slate-200
                  rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-4">
              {/* Step counter for desktop */}
              <span className="hidden sm:block text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-4">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>

              {currentStepIndex < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  suppressHydrationWarning={true}
                  className="flex items-center gap-2 px-10 py-3 text-sm font-bold
                    text-white bg-[#3b67a1] hover:bg-[#2b5a97] rounded-xl
                    transition-all shadow-lg shadow-blue-900/10 active:scale-95 cursor-pointer"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={status === "submitting"}
                  suppressHydrationWarning={true}
                  className={`flex items-center gap-2 px-12 py-3.5 text-sm font-bold
                    text-white rounded-xl transition-all shadow-lg active:scale-95
                    ${
                      status === "submitting"
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/10 cursor-pointer"
                    }`}
                >
                  {status === "submitting" ? (
                    <span className="animate-pulse">Submitting...</span>
                  ) : (
                    <>
                      <ClipboardCheck className="w-5 h-5" />
                      Submit Admission
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}
