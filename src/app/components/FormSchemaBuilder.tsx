'use client';

import React, { useState, useCallback } from 'react';
import {
  X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Save, Settings, Type, Hash, Calendar, Phone, Mail, List,
  CheckSquare, AlertCircle, CheckCircle2, Loader2, Edit2, Check
} from 'lucide-react';

/* ─── Types ─── */
export interface FormStep {
  id: string;
  label: string;
  order: number;
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  label: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'tel' | 'email' | 'select' | 'checkbox';
  stepId: string;
  required: boolean;
  placeholder: string;
  options: FieldOption[];
}

export interface FormSchema {
  id?: number;
  schema_name: string;
  steps: FormStep[];
  fields: FormField[];
}

interface Props {
  schemaName: string;
  onClose: () => void;
  onSaved?: (schema: FormSchema) => void;
}

/* ─── Constants ─── */
const FIELD_TYPES: { value: FormField['type']; label: string; icon: any }[] = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'tel', label: 'Phone', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
];

const TYPE_COLORS: Record<FormField['type'], string> = {
  text: 'bg-blue-50 text-blue-700 border-blue-200',
  number: 'bg-purple-50 text-purple-700 border-purple-200',
  date: 'bg-amber-50 text-amber-700 border-amber-200',
  tel: 'bg-green-50 text-green-700 border-green-200',
  email: 'bg-pink-50 text-pink-700 border-pink-200',
  select: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  checkbox: 'bg-teal-50 text-teal-700 border-teal-200',
};

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

function toFieldName(label: string) {
  return label
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase());
}

/* ─── FieldEditor Component ─── */
interface FieldEditorProps {
  field: FormField;
  steps: FormStep[];
  onChange: (updated: FormField) => void;
  onDelete: () => void;
}

function FieldEditor({ field, steps, onChange, onDelete }: FieldEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const TypeIcon = FIELD_TYPES.find(t => t.value === field.type)?.icon ?? Type;

  const update = (patch: Partial<FormField>) => onChange({ ...field, ...patch });

  const addOption = () =>
    update({ options: [...field.options, { value: '', label: '' }] });

  const updateOption = (i: number, patch: Partial<FieldOption>) => {
    const opts = [...field.options];
    opts[i] = { ...opts[i], ...patch };
    update({ options: opts });
  };

  const removeOption = (i: number) =>
    update({ options: field.options.filter((_, idx) => idx !== i) });

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Field Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="text-slate-300 cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>

        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${TYPE_COLORS[field.type]}`}>
          <TypeIcon className="w-3 h-3" />
          {FIELD_TYPES.find(t => t.value === field.type)?.label}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{field.label || <span className="text-slate-400 italic">Unnamed Field</span>}</p>
          <p className="text-[11px] text-slate-400 font-mono">{field.name || '—'}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {field.required && (
            <span className="text-[10px] font-bold uppercase text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Field Config Panel */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-3 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Label *</label>
              <input
                value={field.label}
                onChange={e => {
                  const label = e.target.value;
                  update({ label, name: toFieldName(label) });
                }}
                placeholder="e.g. Full Name"
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Field Name (key)</label>
              <input
                value={field.name}
                onChange={e => update({ name: e.target.value })}
                placeholder="e.g. FullName"
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Type</label>
              <select
                value={field.type}
                onChange={e => update({ type: e.target.value as FormField['type'], options: [] })}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {FIELD_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Step</label>
              <select
                value={field.stepId}
                onChange={e => update({ stepId: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {steps.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Placeholder</label>
            <input
              value={field.placeholder}
              onChange={e => update({ placeholder: e.target.value })}
              placeholder="e.g. Enter your name..."
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => update({ required: !field.required })}
              className={`w-10 h-5 rounded-full relative transition-colors ${field.required ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.required ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm font-semibold text-slate-700">Required field</span>
          </label>

          {/* Options editor for select */}
          {field.type === 'select' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">Dropdown Options</label>
                <button
                  onClick={addOption}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              </div>
              {field.options.length === 0 && (
                <p className="text-xs text-slate-400 italic">No options yet. Click "Add Option".</p>
              )}
              {field.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt.value}
                    onChange={e => updateOption(i, { value: e.target.value, label: opt.label || e.target.value })}
                    placeholder="Value"
                    className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                  />
                  <input
                    value={opt.label}
                    onChange={e => updateOption(i, { label: e.target.value })}
                    placeholder="Display Label"
                    className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main FormSchemaBuilder ─── */
export default function FormSchemaBuilder({ schemaName, onClose, onSaved }: Props) {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepLabel, setEditingStepLabel] = useState('');

  /* ─── Load schema on mount ─── */
  React.useEffect(() => {
    let mounted = true;
    fetch(`/api/form-schema?name=${encodeURIComponent(schemaName)}`)
      .then(async res => {
        if (!mounted) return;
        if (res.ok) {
          const data: FormSchema = await res.json();
          data.steps = data.steps.sort((a, b) => a.order - b.order);
          setSchema(data);
          setActiveStepId(data.steps[0]?.id ?? null);
        } else if (res.status === 404) {
          // Start fresh
          const defaultStep: FormStep = { id: `step-${nanoid()}`, label: 'Step 1', order: 1 };
          const fresh: FormSchema = { schema_name: schemaName, steps: [defaultStep], fields: [] };
          setSchema(fresh);
          setActiveStepId(defaultStep.id);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [schemaName]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  /* ─── Step Operations ─── */
  const addStep = () => {
    if (!schema) return;
    const newStep: FormStep = {
      id: `step-${nanoid()}`,
      label: `Step ${schema.steps.length + 1}`,
      order: schema.steps.length + 1,
    };
    setSchema(prev => prev ? { ...prev, steps: [...prev.steps, newStep] } : prev);
    setActiveStepId(newStep.id);
  };

  const deleteStep = (stepId: string) => {
    if (!schema) return;
    if (schema.steps.length <= 1) {
      showToast('error', 'You must have at least one step.');
      return;
    }
    const newSteps = schema.steps.filter(s => s.id !== stepId).map((s, i) => ({ ...s, order: i + 1 }));
    const newFields = schema.fields.filter(f => f.stepId !== stepId);
    setSchema(prev => prev ? { ...prev, steps: newSteps, fields: newFields } : prev);
    setActiveStepId(newSteps[0]?.id ?? null);
  };

  const renameStep = (stepId: string, label: string) => {
    setSchema(prev => prev ? {
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, label } : s),
    } : prev);
  };

  const moveStep = (stepId: string, dir: -1 | 1) => {
    if (!schema) return;
    const idx = schema.steps.findIndex(s => s.id === stepId);
    if (idx + dir < 0 || idx + dir >= schema.steps.length) return;
    const newSteps = [...schema.steps];
    [newSteps[idx], newSteps[idx + dir]] = [newSteps[idx + dir], newSteps[idx]];
    setSchema(prev => prev ? { ...prev, steps: newSteps.map((s, i) => ({ ...s, order: i + 1 })) } : prev);
  };

  /* ─── Field Operations ─── */
  const addField = () => {
    if (!schema || !activeStepId) return;
    const newField: FormField = {
      id: `f-${nanoid()}`,
      label: '',
      name: '',
      type: 'text',
      stepId: activeStepId,
      required: false,
      placeholder: '',
      options: [],
    };
    setSchema(prev => prev ? { ...prev, fields: [...prev.fields, newField] } : prev);
  };

  const updateField = useCallback((fieldId: string, updated: FormField) => {
    setSchema(prev => prev ? {
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? updated : f),
    } : prev);
  }, []);

  const deleteField = (fieldId: string) => {
    setSchema(prev => prev ? { ...prev, fields: prev.fields.filter(f => f.id !== fieldId) } : prev);
  };

  const moveField = (fieldId: string, dir: -1 | 1) => {
    if (!schema) return;
    const stepFields = schema.fields.filter(f => f.stepId === activeStepId);
    const otherFields = schema.fields.filter(f => f.stepId !== activeStepId);
    const idx = stepFields.findIndex(f => f.id === fieldId);
    if (idx + dir < 0 || idx + dir >= stepFields.length) return;
    [stepFields[idx], stepFields[idx + dir]] = [stepFields[idx + dir], stepFields[idx]];
    setSchema(prev => prev ? { ...prev, fields: [...otherFields, ...stepFields] } : prev);
  };

  /* ─── Save ─── */
  const handleSave = async () => {
    if (!schema) return;

    // Quick validation
    const emptyFields = schema.fields.filter(f => !f.label.trim() || !f.name.trim());
    if (emptyFields.length > 0) {
      showToast('error', `${emptyFields.length} field(s) have missing label or name. Please fill them in.`);
      return;
    }

    setSaving(true);
    try {
      const method = schema.id ? 'PUT' : 'POST';
      const body = schema.id
        ? { id: schema.id, schema_name: schema.schema_name, steps: schema.steps, fields: schema.fields }
        : { schema_name: schema.schema_name, steps: schema.steps, fields: schema.fields };

      const res = await fetch('/api/form-schema', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      if (method === 'POST') {
        const data = await res.json();
        setSchema(prev => prev ? { ...prev, id: data.insertId } : prev);
      }

      showToast('success', 'Form schema saved successfully!');
      onSaved?.(schema);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save schema.');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Render ─── */
  const activeStepFields = schema?.fields.filter(f => f.stepId === activeStepId) ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Form Builder</h2>
              <p className="text-xs text-slate-500 font-medium">Design your form steps and fields</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Schema'}
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-6 mt-3 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {toast.msg}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">

            {/* ── LEFT: Steps Panel ── */}
            <div className="w-56 flex-shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Steps</p>
                <button
                  onClick={addStep}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {schema?.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`group rounded-xl border transition-all ${activeStepId === step.id ? 'bg-blue-600 border-blue-600 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                  >
                    {editingStepId === step.id ? (
                      <div className="flex items-center gap-1 px-2 py-2">
                        <input
                          autoFocus
                          value={editingStepLabel}
                          onChange={e => setEditingStepLabel(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              renameStep(step.id, editingStepLabel || step.label);
                              setEditingStepId(null);
                            }
                            if (e.key === 'Escape') setEditingStepId(null);
                          }}
                          className="flex-1 text-xs px-2 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <button onClick={() => { renameStep(step.id, editingStepLabel || step.label); setEditingStepId(null); }}
                          className="text-blue-600 hover:text-blue-800">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveStepId(step.id)}
                        className="w-full text-left px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ${activeStepId === step.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {idx + 1}
                          </span>
                          <span className={`text-xs font-semibold flex-1 truncate ${activeStepId === step.id ? 'text-white' : 'text-slate-700'}`}>{step.label}</span>
                        </div>
                        <p className={`text-[10px] mt-0.5 ml-7 ${activeStepId === step.id ? 'text-blue-200' : 'text-slate-400'}`}>
                          {schema?.fields.filter(f => f.stepId === step.id).length} fields
                        </p>
                      </button>
                    )}

                    {/* Step actions */}
                    {activeStepId === step.id && editingStepId !== step.id && (
                      <div className="flex items-center gap-0.5 px-2 pb-2">
                        <button onClick={() => { setEditingStepId(step.id); setEditingStepLabel(step.label); }}
                          className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/20 transition-colors text-[10px]" title="Rename">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveStep(step.id, -1)} disabled={idx === 0}
                          className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/20 transition-colors disabled:opacity-30" title="Move up">
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveStep(step.id, 1)} disabled={idx === (schema?.steps.length ?? 0) - 1}
                          className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/20 transition-colors disabled:opacity-30" title="Move down">
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteStep(step.id)}
                          className="p-1 rounded-lg text-blue-200 hover:text-red-300 hover:bg-white/20 transition-colors ml-auto" title="Delete step">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Fields Panel ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {schema?.steps.find(s => s.id === activeStepId)?.label ?? 'Select a step'}
                  </p>
                  <p className="text-xs text-slate-500">{activeStepFields.length} field(s) in this step</p>
                </div>
                <button
                  onClick={addField}
                  disabled={!activeStepId}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-40 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Field
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {activeStepFields.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <List className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-semibold">No fields yet</p>
                    <p className="text-xs mt-1">Click "Add Field" to create input fields for this step.</p>
                  </div>
                ) : (
                  activeStepFields.map((field, idx) => (
                    <div key={field.id} className="relative">
                      <FieldEditor
                        field={field}
                        steps={schema?.steps ?? []}
                        onChange={updated => updateField(field.id, updated)}
                        onDelete={() => deleteField(field.id)}
                      />
                      {/* Move up/down handles */}
                      <div className="absolute -right-0 top-3 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveField(field.id, -1)} disabled={idx === 0}
                          className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveField(field.id, 1)} disabled={idx === activeStepFields.length - 1}
                          className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
