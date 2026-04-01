'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Save, Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Type, Hash, Calendar, Phone, Mail, List, CheckSquare,
  AlertCircle, CheckCircle2, Loader2, Edit2, Check, X,
  ClipboardList, Info, Printer, ShieldAlert
} from 'lucide-react';
import PrintableForm from '@/app/components/PrintableForm';
import { useStatusModal } from '@/app/components/StatusModalContext';
 circular_dependency_warning: false

/* ─── Types ─── */
interface FormStep {
  id: string;
  label: string;
  order: number;
}

interface FieldOption {
  value: string;
  label: string;
}

interface FormField {
  id: string;
  label: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'tel' | 'email' | 'select' | 'checkbox';
  stepId: string;
  required: boolean;
  placeholder: string;
  options: FieldOption[];
}

interface FormSchema {
  id?: number;
  schema_name: string;
  steps: FormStep[];
  fields: FormField[];
}

const SCHEMA_NAME = 'patient-admission';

/* ─── Constants ─── */
const FIELD_TYPES: { value: FormField['type']; label: string; icon: any; color: string }[] = [
  { value: 'text',     label: 'Text',     icon: Type,        color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'number',   label: 'Number',   icon: Hash,        color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'date',     label: 'Date',     icon: Calendar,    color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'tel',      label: 'Phone',    icon: Phone,       color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'email',    label: 'Email',    icon: Mail,        color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { value: 'select',   label: 'Dropdown', icon: List,        color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'bg-teal-50 text-teal-700 border-teal-200' },
];

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

function toFieldName(label: string) {
  return label
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase());
}

/* ─── Field Editor Row ─── */
function FieldRow({
  field, steps, index, total,
  onChange, onDelete, onMove,
  isReadOnly, canDelete
}: {
  field: FormField; steps: FormStep[]; index: number; total: number;
  onChange: (f: FormField) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  isReadOnly?: boolean;
  canDelete?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = FIELD_TYPES.find(t => t.value === field.type) ?? FIELD_TYPES[0];
  const TypeIcon = typeInfo.icon;

  const update = (patch: Partial<FormField>) => {
    if (isReadOnly) return;
    onChange({ ...field, ...patch });
  };

  const addOption = () => update({ options: [...field.options, { value: '', label: '' }] });
  const updateOption = (i: number, patch: Partial<FieldOption>) => {
    const opts = [...field.options];
    opts[i] = { ...opts[i], ...patch };
    update({ options: opts });
  };
  const removeOption = (i: number) => update({ options: field.options.filter((_, idx) => idx !== i) });

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${expanded ? 'border-blue-200 shadow-sm' : 'border-slate-200 hover:border-slate-300'} bg-white`}>
      {/* Row Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Move handles */}
        {!isReadOnly && (
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <button onClick={() => onMove(-1)} disabled={index === 0}
              className="p-0.5 text-slate-300 hover:text-slate-500 disabled:opacity-20 transition-colors">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onMove(1)} disabled={index === total - 1}
              className="p-0.5 text-slate-300 hover:text-slate-500 disabled:opacity-20 transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />

        {/* Type badge */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border flex-shrink-0 ${typeInfo.color}`}>
          <TypeIcon className="w-3 h-3" />
          {typeInfo.label}
        </span>

        {/* Label & name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {field.label || <span className="text-slate-400 italic">Unnamed Field</span>}
          </p>
          <p className="text-[11px] text-slate-400 font-mono truncate">{field.name || '—'}</p>
        </div>

        {/* Required badge */}
        {field.required && (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-red-50 text-red-500 rounded-md flex-shrink-0">
            Required
          </span>
        )}

        {/* Step badge */}
        <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md flex-shrink-0 hidden sm:block">
          {steps.find(s => s.id === field.stepId)?.label ?? '—'}
        </span>

        {/* Actions */}
        <button onClick={() => setExpanded(v => !v)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {!isReadOnly && canDelete && (
          <button onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expanded Config */}
      {expanded && (
        <div className="px-4 pb-5 pt-3 border-t border-slate-100 bg-slate-50/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Label *</label>
              <input
                disabled={isReadOnly}
                value={field.label}
                onChange={e => update({ label: e.target.value, name: toFieldName(e.target.value) })}
                placeholder="e.g. Full Name"
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Field Key</label>
              <input
                disabled={isReadOnly}
                value={field.name}
                onChange={e => update({ name: e.target.value })}
                placeholder="e.g. FullName"
                className="px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Type</label>
              <select
                disabled={isReadOnly}
                value={field.type}
                onChange={e => update({ type: e.target.value as FormField['type'], options: [] })}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Step</label>
              <select
                disabled={isReadOnly}
                value={field.stepId}
                onChange={e => update({ stepId: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {steps.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Placeholder</label>
              <input
                disabled={isReadOnly}
                value={field.placeholder}
                onChange={e => update({ placeholder: e.target.value })}
                placeholder="Optional hint text..."
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                disabled={isReadOnly}
                onClick={() => update({ required: !field.required })}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${field.required ? 'bg-blue-600' : 'bg-slate-300'} ${isReadOnly ? 'opacity-50' : ''}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.required ? 'translate-x-5' : ''}`} />
              </button>
              <label className={`text-sm font-semibold text-slate-700 select-none ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`} onClick={() => update({ required: !field.required })}>
                Required field
              </label>
            </div>
          </div>

          {/* Dropdown options */}
          {field.type === 'select' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">Dropdown Options</label>
                {!isReadOnly && (
                  <button onClick={addOption}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                )}
              </div>
              {field.options.length === 0 && (
                <p className="text-xs text-slate-400 italic">No options yet.</p>
              )}
              <div className="space-y-1.5">
                {field.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={opt.value}
                      disabled={isReadOnly}
                      onChange={e => updateOption(i, { value: e.target.value, label: opt.label || e.target.value })}
                      placeholder="Value"
                      className="flex-1 px-2 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50" />
                    <input value={opt.label}
                      disabled={isReadOnly}
                      onChange={e => updateOption(i, { label: e.target.value })}
                      placeholder="Display label"
                      className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50" />
                    {!isReadOnly && (
                      <button onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page Component ─── */
export default function ManageFormsPage() {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepLabel, setEditingStepLabel] = useState('');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const { showSuccess, showError, showConfirm, setLoading: setGlobalLoading } = useStatusModal();
  
  // RBAC State
  const [permissions, setPermissions] = useState<any>(null);
  const [isLoadingPerms, setIsLoadingPerms] = useState(true);

  /* ─── Empty form data for blank print ─── */
  const EMPTY_FORM_DATA: Record<string, any> = {
    isEmptyForm: true,
    LastName: '', GivenName: '', MiddleName: '', Suffix: '',
    Age: '', Birthday: '', BirthPlace: '', Sex: '',
    ContactNumber: '', CivilStatus: '', Religion: '', Citizenship: '',
    CityAddress: '', ProvincialAddress: '', Occupation: '',
    FatherFamilyName: '', FatherGivenName: '', FatherMiddleName: '', FatherContact: '',
    MotherFamilyName: '', MotherGivenName: '', MotherMiddleName: '', MotherContact: '',
    SpouseFamilyName: '', SpouseGivenName: '', SpouseMiddleName: '', SpouseContact: '',
    EmergencyContactName: '', EmergencyRelation: '', EmergencyContactNumber: '',
    ResponsibleName: '', ResponsibleRelation: '', ResponsibleContact: '', ResponsibleAddress: '',
    AttendingPhysician: '', ServiceCaseType: '',
  };

  /* ─── Fetch Permissions & Schema ─── */
  useEffect(() => {
    let mounted = true;
    
    // Fetch Permissions
    fetch('/api/rbac/permissions/me')
      .then(res => res.json())
      .then(data => {
        if (!mounted) return;
        const mod = data.find((p: any) => p.ModuleName === 'Forms');
        setPermissions(mod || { CanView: true, CanAdd: false, CanEdit: false, CanDelete: false });
        setIsLoadingPerms(false);
      });

    // Fetch Schema
    fetch(`/api/form-schema?name=${SCHEMA_NAME}&_t=${Date.now()}`, { cache: 'no-store' })
      .then(async res => {
        if (!mounted) return;
        if (res.ok) {
          const data: FormSchema = await res.json();
          data.steps = data.steps.sort((a, b) => a.order - b.order);
          setSchema(data);
          setActiveStepId(data.steps[0]?.id ?? null);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
      
    return () => { mounted = false; };
  }, []);

  /* ─── Print empty form ─── */
  const handlePrintEmpty = () => {
    const content = document.getElementById('empty-print-form');
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML).join('');
    win.document.write(
      `<html><head><title>Blank Patient Admission Form</title>${styles}
      <style>@media print { .no-print { display:none; } body { margin:0; padding:0; } }</style>
      </head><body>${content.innerHTML}</body></html>`
    );
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };


  /* ─── Step operations ─── */
  const addStep = () => {
    if (!schema || !permissions?.CanAdd) return;
    const newStep: FormStep = { id: `step-${nanoid()}`, label: `Step ${schema.steps.length + 1}`, order: schema.steps.length + 1 };
    setSchema(prev => prev ? { ...prev, steps: [...prev.steps, newStep] } : prev);
    setActiveStepId(newStep.id);
  };

  const deleteStep = (stepId: string) => {
    if (!schema) return;
    if (!permissions?.CanDelete) {
      showError('Permission Denied', 'You do not have permission to delete form steps.');
      return;
    }
    if (schema.steps.length <= 1) {
      showError('Action Blocked', 'At least one step is required for the form.');
      return;
    }

    setSchema(prev => {
      if (!prev) return prev;
      const newSteps = prev.steps.filter(s => s.id !== stepId).map((s, i) => ({ ...s, order: i + 1 }));
      const newFields = prev.fields.filter(f => f.stepId !== stepId);
      
      if (activeStepId === stepId) {
         setActiveStepId(newSteps[0]?.id ?? null);
      }
      
      return { ...prev, steps: newSteps, fields: newFields };
    });
  };

  const renameStep = (stepId: string, label: string) => {
    if (!permissions?.CanEdit) return;
    setSchema(prev => prev ? { ...prev, steps: prev.steps.map(s => s.id === stepId ? { ...s, label } : s) } : prev);
  };

  const moveStep = (stepId: string, dir: -1 | 1) => {
    if (!schema || !permissions?.CanEdit) return;
    const idx = schema.steps.findIndex(s => s.id === stepId);
    if (idx + dir < 0 || idx + dir >= schema.steps.length) return;
    const arr = [...schema.steps];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    setSchema(prev => prev ? { ...prev, steps: arr.map((s, i) => ({ ...s, order: i + 1 })) } : prev);
  };

  /* ─── Field operations ─── */
  const addField = () => {
    if (!schema || !activeStepId || !permissions?.CanAdd) return;
    const newField: FormField = {
      id: `f-${nanoid()}`, label: '', name: '', type: 'text',
      stepId: activeStepId, required: false, placeholder: '', options: [],
    };
    setSchema(prev => prev ? { ...prev, fields: [...prev.fields, newField] } : prev);
  };

  const updateField = useCallback((fieldId: string, updated: FormField) => {
    if (!permissions?.CanEdit) return;
    setSchema(prev => prev ? { ...prev, fields: prev.fields.map(f => f.id === fieldId ? updated : f) } : prev);
  }, [permissions]);

  const deleteField = (fieldId: string) => {
    if (!permissions?.CanDelete) {
      showError('Permission Denied', 'You do not have permission to delete fields.');
      return;
    }
    setSchema(prev => prev ? { ...prev, fields: prev.fields.filter(f => f.id !== fieldId) } : prev);
  };

  const moveField = (fieldId: string, dir: -1 | 1) => {
    if (!schema || !permissions?.CanEdit) return;
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
    if (!permissions?.CanEdit) {
      showError('Permission Denied', 'You do not have permission to modify the form configuration.');
      return;
    }

    const empty = schema.fields.filter(f => !f.label.trim() || !f.name.trim());
    if (empty.length > 0) {
      showError('Incomplete Fields', `${empty.length} field(s) are missing a label or key name. Please fix them before saving.`);
      return;
    }

    showConfirm(
      'Save Changes?',
      'Are you sure you want to save the new form layout? This will permanently update the form for all users.',
      async () => {
        setSaving(true);
        setGlobalLoading(true);
        try {
          const method = schema.id ? 'PUT' : 'POST';
          const body = { 
            id: schema.id, 
            schema_name: schema.schema_name, 
            steps: schema.steps, 
            fields: schema.fields 
          };
          
          const res = await fetch('/api/form-schema', { 
            method, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(body) 
          });
          
          if (!res.ok) { 
            const e = await res.json(); 
            throw new Error(e.error || 'Failed to save form schema'); 
          }
          
          if (method === 'POST') {
            const d = await res.json();
            setSchema(prev => prev ? { ...prev, id: d.insertId } : prev);
          }
          
          showSuccess('Settings Saved', 'The Patient Admission form configuration has been successfully updated.');
        } catch (err: any) {
          showError('Save Failed', err.message || 'An unexpected error occurred while saving.');
        } finally {
          setSaving(false);
          setGlobalLoading(false);
        }
      }
    );
  };

  /* ─── Derived data ─── */
  const activeStepFields = schema?.fields.filter(f => f.stepId === activeStepId) ?? [];
  const totalFields = schema?.fields.length ?? 0;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ height: 'calc(100vh - var(--header-height) - 2rem)' }}>

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Manage Forms
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Configure the Patient Admission form — steps, fields, and required status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Permissions Warning badge */}
          {!isLoadingPerms && !permissions?.CanEdit && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-xs font-bold">
               <ShieldAlert className="w-4 h-4" /> Restricted Mode (View Only)
            </div>
          )}

          {/* Field count */}
          {!loading && schema && (
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
              {totalFields} fields · {schema.steps.length} steps
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saving || loading || !permissions?.CanEdit}
            className="flex items-center gap-2 px-5 py-2.5 bg-vmed-blue-dark text-white text-sm font-bold rounded-xl hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>


      {/* ── Info Banner ── */}
      <div className="mb-4 px-4 py-3 rounded-xl flex items-start gap-3 text-sm text-slate-600 bg-blue-50 border border-blue-100 flex-shrink-0">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p>This form is pre-loaded with all fields from the <strong>Patient Admission</strong> form (Steps 1–3). You can add new fields, change step assignments, toggle required status, or reorder everything.</p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : schema ? (
        <div className="flex gap-4 flex-1 min-h-0">

          {/* ── LEFT: Steps Panel ── */}
          <div className="w-60 flex-shrink-0 glass-panel rounded-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Form Steps</p>
              {!isLoadingPerms && permissions?.CanAdd && (
                <button
                  onClick={addStep}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {schema.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`group rounded-xl border overflow-hidden transition-all ${activeStepId === step.id ? 'bg-vmed-blue-dark border-vmed-blue-dark shadow-sm shadow-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                >
                  {editingStepId === step.id ? (
                    <div className="flex items-center gap-1.5 px-3 py-2.5">
                      <input
                        autoFocus
                        value={editingStepLabel}
                        onChange={e => setEditingStepLabel(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { renameStep(step.id, editingStepLabel || step.label); setEditingStepId(null); }
                          if (e.key === 'Escape') setEditingStepId(null);
                        }}
                        className="flex-1 text-xs px-2 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                      />
                      <button onClick={() => { renameStep(step.id, editingStepLabel || step.label); setEditingStepId(null); }}
                        className="text-blue-600 hover:text-blue-800">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setActiveStepId(step.id)} className="w-full text-left px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ${activeStepId === step.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {idx + 1}
                        </span>
                        <span className={`text-xs font-semibold flex-1 truncate text-left ${activeStepId === step.id ? 'text-white' : 'text-slate-700'}`}>{step.label}</span>
                      </div>
                      <p className={`text-[10px] mt-0.5 ml-7 ${activeStepId === step.id ? 'text-blue-200' : 'text-slate-400'}`}>
                        {schema.fields.filter(f => f.stepId === step.id).length} fields
                      </p>
                    </button>
                  )}

                  {/* Step action buttons (shown when active) */}
                  {activeStepId === step.id && editingStepId !== step.id && permissions?.CanEdit && (
                    <div className="flex items-center gap-0.5 px-2 pb-2">
                      <button onClick={() => { setEditingStepId(step.id); setEditingStepLabel(step.label); }}
                        title="Rename" className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/20 transition-colors">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveStep(step.id, -1)} disabled={idx === 0}
                        title="Move up" className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/20 transition-colors disabled:opacity-30">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveStep(step.id, 1)} disabled={idx === schema.steps.length - 1}
                        title="Move down" className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/20 transition-colors disabled:opacity-30">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {permissions?.CanDelete && (
                        <button onClick={() => deleteStep(step.id)}
                          title="Delete step" className="p-1 rounded-lg text-blue-200 hover:text-red-300 hover:bg-white/20 transition-colors ml-auto">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Fields Panel ── */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Fields header */}
            <div className="glass-panel rounded-2xl px-5 py-3 mb-3 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {schema.steps.find(s => s.id === activeStepId)?.label ?? 'Select a step'}
                </p>
                <p className="text-xs text-slate-500">{activeStepFields.length} field(s) in this step</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintPreviewOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Empty Form
                </button>
                {!isLoadingPerms && permissions?.CanAdd && (
                  <button
                    onClick={addField}
                    disabled={!activeStepId}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-vmed-blue-dark hover:bg-vmed-blue-light rounded-xl transition-all disabled:opacity-40 shadow-sm shadow-blue-200"
                  >
                    <Plus className="w-4 h-4" /> Add Field
                  </button>
                )}
              </div>
            </div>

            {/* Fields list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {activeStepFields.length === 0 ? (
                <div className="glass-panel rounded-2xl flex flex-col items-center justify-center py-16 text-slate-400">
                  <List className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-semibold">No fields in this step</p>
                  <p className="text-xs mt-1">Click "Add Field" to add input fields here.</p>
                </div>
              ) : (
                activeStepFields.map((field, idx) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    steps={schema.steps}
                    index={idx}
                    total={activeStepFields.length}
                    onChange={updated => updateField(field.id, updated)}
                    onDelete={() => deleteField(field.id)}
                    onMove={dir => moveField(field.id, dir)}
                    isReadOnly={!permissions?.CanEdit}
                    canDelete={permissions?.CanDelete}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <p className="text-sm">Failed to load form schema.</p>
        </div>
      )}

      {/* ── Print Empty Form Modal ── */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-vmed-blue-dark" />
                  Print Empty Form
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Blank admission form — all fields will print empty</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintEmpty}
                  className="flex items-center gap-2 px-5 py-2 bg-vmed-blue-dark text-white text-sm font-bold rounded-xl hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Preview Body */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
              <div id="empty-print-form" className="bg-white rounded-lg shadow mx-auto">
                <PrintableForm formData={EMPTY_FORM_DATA} />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
