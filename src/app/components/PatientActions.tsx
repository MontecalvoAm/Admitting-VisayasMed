'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Eye, Edit, Trash2, Loader2, Clock, ShieldAlert } from 'lucide-react';
import Modal from './Modal';
import PatientForm from './PatientForm';
import PrintableForm from './PrintableForm';
import { useRouter } from 'next/navigation';
import AuditTrail from './AuditTrail';
import { useStatusModal } from './StatusModalContext';

import { AdmitData } from '@/lib/schemas';

interface PatientPermissions {
  CanView: boolean;
  CanAdd: boolean;
  CanEdit: boolean;
  CanDelete: boolean;
}

interface PatientActionsProps {
  patient: AdmitData & { Id: number; CreatedAt?: string; CurrentAdmissionID?: number };
  isAdmission?: boolean;
  onSuccess?: () => void;
  onInteraction?: () => void;
}

const PatientActions: React.FC<PatientActionsProps> = ({ patient, isAdmission = false, onSuccess, onInteraction }) => {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Partial<AdmitData & { Id: number; CreatedAt?: string; UpdatedAt?: string; CurrentAdmissionID?: number }>>({ ...patient });
  const [permissions, setPermissions] = useState<PatientPermissions | null>(null);
  const [isLoadingPerms, setIsLoadingPerms] = useState(true);
  const { showSuccess, showError, showConfirm, setLoading, hideModal } = useStatusModal();
  const router = useRouter();

  // Fetch permissions
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/rbac/permissions/me');
      if (res.ok) {
        const data = await res.json();
        const mod = data.find((p: { ModuleName: string }) => p.ModuleName === 'Patients');
        setPermissions(mod || { CanView: true, CanAdd: false, CanEdit: false, CanDelete: false });
      }
    } catch (err) {
      console.error('Error fetching permissions for PatientActions:', err);
    } finally {
      setIsLoadingPerms(false);
    }
  };

  // Update editedPatient when patient prop changes (after router.refresh)
  useEffect(() => {
    setEditedPatient({ ...patient });
  }, [patient]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEditedPatient((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!permissions?.CanEdit) return;
    setIsSaving(true);
    try {
      const endpoint = isAdmission ? `/api/admissions/${patient.Id}` : `/api/patients/${patient.Id}`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedPatient),
      });
      if (res.ok) {
        setIsEditOpen(false);
        if (onSuccess) onSuccess();
        router.refresh();
        showSuccess('Update Successful', 'Patient information has been correctly updated in the system.');
      } else {
        const errorData = await res.json();
        showError('Update Failed', errorData.error || 'Failed to update patient information.');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      showError('System Error', 'An unexpected error occurred during the update process.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReAdmit = async () => {
    if (!permissions?.CanAdd) return;

    showConfirm(
      'Re-Admission Confirmation',
      `Are you sure you want to Re-Admit ${patient.LastName}, ${patient.GivenName}? This will create a new admission record for this patient.`,
      async () => {
        setLoading(true);
        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { Id, CreatedAt, UpdatedAt, ...newData } = editedPatient;
          const reAdmitData = {
            ...newData,
            PreviouslyAdmitted: true,
            PreviousAdmissionDate: CreatedAt || patient.CreatedAt,
          };

          const res = await fetch('/api/patients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reAdmitData),
          });

          if (res.ok) {
            setIsEditOpen(false);
            router.refresh();
            hideModal();
            setTimeout(() => {
              showSuccess('Patient Re-Admitted', 'Patient successfully re-admitted. A new record has been created.');
            }, 300);
          } else {
            const errorData = await res.json();
            showError('Re-Admission Failed', errorData.error || 'Failed to re-admit patient.');
          }
        } catch (error) {
          console.error('Error re-admitting patient:', error);
          showError('System Error', 'An unexpected error occurred while processing re-admission.');
        } finally {
          setLoading(false);
        }
      },
      'Confirm Re-Admit'
    );
  };


  const markAsViewed = async () => {
    try {
      const admissionId = isAdmission ? patient.Id : patient.CurrentAdmissionID;
      if (!admissionId) return;

      await fetch(`/api/admissions/${admissionId}/view`, {
        method: 'PUT',
      });
      
      if (onInteraction) onInteraction();
    } catch (err) {
      console.error('Failed to mark as viewed:', err);
    }
  };

  const handleDelete = async () => {
    if (!permissions?.CanDelete) return;
    
    showConfirm(
      'Confirm Deletion',
      `Are you sure you want to delete the record of ${patient.LastName}, ${patient.GivenName}? This will move the record to the archive.`,
      async () => {
        setLoading(true);
        try {
          const endpoint = isAdmission ? `/api/admissions/${patient.Id}` : `/api/patients/${patient.Id}`;
          const res = await fetch(endpoint, {
            method: 'DELETE',
          });
          if (res.ok) {
            if (onSuccess) onSuccess();
            router.refresh();
            hideModal();
            setTimeout(() => {
              showSuccess('Record Deleted', 'The patient record has been successfully moved to the system archive.');
            }, 300);
          } else {
            const errorData = await res.json();
            showError('Deletion Failed', errorData.error || 'Failed to delete record.');
          }
        } catch (error) {
          console.error('Error deleting patient:', error);
          showError('System Error', 'An unexpected error occurred during the deletion process.');
        } finally {
          setLoading(false);
        }
      },
      'Delete Record'
    );
  };

  const executePrint = async () => {
    // Record Audit Log for Printing
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PRINT',
          resource: isAdmission ? 'Admission' : 'Patient',
          resourceId: patient.Id,
          details: `Admission form printed for ${patient.LastName}, ${patient.GivenName}.`
        })
      });
    } catch (err) {
      console.error('Failed to log print action:', err);
    }

    const printContent = document.getElementById(`print-form-content-${patient.Id}`);
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print Patient Form</title>');
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(style => {
          printWindow.document.write(style.outerHTML);
        });
        printWindow.document.write('<style>@media print { .no-print { display: none; } body { margin: 0; padding: 0; } }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button 
        onClick={() => {
          setIsPrintPreviewOpen(true);
          markAsViewed();
        }}
        suppressHydrationWarning
        className="p-2 text-slate-400 hover:text-vmed-blue-dark hover:bg-blue-50 rounded-lg transition-all"
        title="Print Preview"
      >
        <Printer className="w-4 h-4" />
      </button>

      <button 
        onClick={() => {
          setIsViewOpen(true);
          markAsViewed();
        }}
        suppressHydrationWarning
        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>

      {!isLoadingPerms && permissions?.CanEdit && (
        <button 
          onClick={() => {
            setEditedPatient({ ...patient });
            setIsEditOpen(true);
            markAsViewed();
          }}
          suppressHydrationWarning
          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
          title="Edit Record"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}

      {!isLoadingPerms && permissions?.CanDelete && (
        <button 
          onClick={handleDelete}
          suppressHydrationWarning
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          title="Delete Record"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {!isLoadingPerms && !permissions?.CanEdit && !permissions?.CanDelete && (
        <div className="flex items-center justify-center w-8 h-8 text-slate-200" title="Actions Restricted">
           <ShieldAlert className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Print Preview Modal */}
      <Modal 
        isOpen={isPrintPreviewOpen} 
        onClose={() => setIsPrintPreviewOpen(false)} 
        title="Print Preview"
        width="max-w-5xl"
      >
        <div className="bg-slate-100 p-8 rounded-2xl overflow-hidden mb-6">
          <div id={`print-form-content-${patient.Id}`} className="bg-white shadow-xl mx-auto rounded-lg overflow-hidden">
            <PrintableForm formData={patient} />
          </div>
        </div>
        <div className="flex justify-end gap-3 no-print">
          <button 
            onClick={() => setIsPrintPreviewOpen(false)}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button 
            onClick={executePrint}
            className="flex items-center gap-2 px-6 py-2 bg-vmed-blue-dark text-white rounded-xl font-bold hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200"
          >
            <Printer className="w-4 h-4" />
            Print Document
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal 
        isOpen={isViewOpen} 
        onClose={() => setIsViewOpen(false)} 
        title="Patient Details"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar no-print">
          <PatientForm formData={patient} isReadOnly={true} />
          
          <div className="mt-8">
            <AuditTrail resource="Patient" id={patient.Id} />
          </div>
        </div>
        <div className="mt-8 flex justify-end no-print">
          <button 
            onClick={() => setIsViewOpen(false)}
            className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        title="Edit Patient Information"
      >
        <PatientForm formData={editedPatient} onChange={handleEditChange} />
        <div className="mt-8 flex justify-end gap-3">
          {permissions?.CanAdd && (
            <button 
              onClick={handleReAdmit}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              Re-Admit Patient
            </button>
          )}
          <button 
            onClick={handleSaveEdit}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-vmed-blue-dark text-white rounded-xl font-bold hover:bg-vmed-blue-light transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default PatientActions;
