'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle,
  Loader2, FileText, Eye
} from 'lucide-react';
import StepIndicator from './StepIndicator';
import type { FormSchema, FormField } from './FormSchemaBuilder';
import { useStatusModal } from './StatusModalContext';

interface Props {
  schemaName: string;
  onClose: () => void;
}

type FieldValue = string | boolean;
type FormValues = Record<string, FieldValue>;
type ValidationErrors = Record<string, string>;

/* ─── Field Renderer ─── */
function renderField(field: FormField, value: FieldValue, onChange: (name: string, val: FieldValue) => void, error?: string) {
  const baseInput = `w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}`;

  return (
    <div key={field.id} className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {field.type === 'select' ? (
        <select
          name={field.name}
          value={String(value ?? '')}
          onChange={e => onChange(field.name, e.target.value)}
          className={baseInput}
        >
          <option value="">Select...</option>
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-center gap-2.5 cursor-pointer select-none mt-1">
          <input
            type="checkbox"
            name={field.name}
            checked={Boolean(value)}
            onChange={e => onChange(field.name, e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600">{field.placeholder || field.label}</span>
        </label>
      ) : (
        <input
          type={field.type}
          name={field.name}
          value={String(value ?? '')}
          onChange={e => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          className={baseInput}
        />
      )}

      {error && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

/* ─── Review View ─── */
function ReviewView({ schema, values }: { schema: FormSchema; values: FormValues }) {
  return (
    <div className="space-y-6">
      {schema.steps.map(step => {
        const stepFields = schema.fields.filter(f => f.stepId === step.id);
        if (stepFields.length === 0) return null;
        return (
          <div key={step.id} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{step.label}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 p-4">
              {stepFields.map(field => (
                <div key={field.id}>
                  <p className="text-xs font-semibold text-slate-500 uppercase">{field.label}</p>
                  <p className="text-sm text-slate-800 mt-0.5 font-medium">
                    {field.type === 'checkbox'
                      ? (values[field.name] ? '✓ Yes' : '✗ No')
                      : (String(values[field.name] || '') || '—')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ─── */
export default function DoctorFormRenderer({ schemaName, onClose }: Props) {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { showSuccess, showError } = useStatusModal();

  /* ─── Load schema ─── */
  useEffect(() => {
    let mounted = true;
    fetch(`/api/form-schema?name=${encodeURIComponent(schemaName)}`)
      .then(async res => {
        if (!mounted) return;
        if (!res.ok) {
          setLoadError('Form not found. Ask an admin to set up the form first.');
          return;
        }
        const data: FormSchema = await res.json();
        data.steps = data.steps.sort((a, b) => a.order - b.order);
        setSchema(data);

        // Initialize default values
        const init: FormValues = {};
        data.fields.forEach(f => {
          init[f.name] = f.type === 'checkbox' ? false : '';
        });
        setValues(init);
      })
      .catch(() => { if (mounted) setLoadError('Failed to load form. Please try again.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [schemaName]);

  const handleChange = useCallback((name: string, val: FieldValue) => {
    setValues(prev => ({ ...prev, [name]: val }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const TOTAL_STEPS = (schema?.steps.length ?? 0) + 1; // +1 for review step

  const validateCurrentStep = (): boolean => {
    if (!schema) return true;
    const stepDef = schema.steps[currentStep - 1];
    if (!stepDef) return true; // review step
    const stepFields = schema.fields.filter(f => f.stepId === stepDef.id && f.required);
    const newErrors: ValidationErrors = {};
    stepFields.forEach(f => {
      const val = values[f.name];
      if (f.type === 'checkbox') return; // checkboxes can't be "empty"
      if (!String(val ?? '').trim()) {
        newErrors[f.name] = `${f.label} is required.`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      setStatus('error');
      setErrorMessage('Please complete all required fields before continuing.');
      return;
    }
    setStatus('idle');
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setStatus('idle');
  };

  const handleSubmit = async () => {
    if (!schema) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/form-schema/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema_name: schema.schema_name, data: values }),
      });
      if (!res.ok) throw new Error('Submission failed');
      
      onClose();
      showSuccess('Submission Successful', 'Your registration information has been recorded in our system. Thank you!');
    } catch (err: unknown) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(msg);
      showError('Submission Error', 'We encountered an error while submitting your form. Please check your connection and try again.');
    }
  };


  /* ─── Step definitions for indicator ─── */
  const stepIndicatorSteps = schema
    ? [...schema.steps.map(s => ({ label: s.label, shortLabel: s.label.split(' ')[0] })), { label: 'Review', shortLabel: 'Review' }]
    : [];


  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Doctor Registration</h2>
              {schema && (
                <p className="text-xs text-slate-500 font-medium">Step {currentStep} of {TOTAL_STEPS}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-sm font-semibold text-slate-700">{loadError}</p>
            </div>
          ) : schema ? (
            <div className="p-6 space-y-6">
              {/* Step Indicator */}
              <StepIndicator steps={stepIndicatorSteps} currentStep={currentStep} />

              {/* Error Banner */}
              {status === 'error' && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-red-700">{errorMessage}</span>
                </div>
              )}

              {/* Step Content */}
              {currentStep <= schema.steps.length ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">
                      {schema.steps[currentStep - 1]?.label}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {schema.fields
                      .filter(f => f.stepId === schema.steps[currentStep - 1]?.id)
                      .map(field => renderField(field, values[field.name] ?? (field.type === 'checkbox' ? false : ''), handleChange, errors[field.name]))}
                  </div>
                </div>
              ) : (
                /* Review Step */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-800">Review Your Information</h3>
                  </div>
                  <ReviewView schema={schema} values={values} />
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Navigation */}
        {!loading && !loadError && schema && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {currentStep < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={status === 'submitting'}
                className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {status === 'submitting' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Submit</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
