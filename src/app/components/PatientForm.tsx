'use client';

import React from 'react';
import { User, Users, Phone, FileText } from 'lucide-react';
import { InputField, SelectField } from './InputField';

import { AdmitData } from '@/lib/schemas';

interface PatientFormProps {
  formData: Partial<AdmitData & { Id?: number; CreatedAt?: string }>;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isReadOnly?: boolean;
}

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

const PatientForm: React.FC<PatientFormProps> = ({ formData, onChange, isReadOnly = false }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!isReadOnly && onChange) {
      const { name, value } = e.target;
      onChange(e);

      // If Birthday changed, manually trigger an age change if possible
      if (name === "Birthday" && value) {
        const newAge = calculateAge(value);
        onChange({
          target: { name: "Age", value: newAge }
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const sectionHeader = (title: string, Icon: React.ComponentType<{ className?: string }>) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
      <div className="p-1.5 bg-slate-50 rounded-lg">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Patient Information */}
      <section>
        {sectionHeader("Patient Information", User)}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InputField label="Last Name" name="LastName" value={formData.LastName || ''} onChange={handleChange} required className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Given Name" name="GivenName" value={formData.GivenName || ''} onChange={handleChange} required className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Middle Name" name="MiddleName" value={formData.MiddleName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Suffix" name="Suffix" value={formData.Suffix || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          
          <InputField 
            label="Age" 
            name="Age" 
            value={formData.Age || ''} 
            onChange={handleChange} 
            type="number" 
            required 
            isReadOnly={true} 
            placeholder="Age automatically calculated"
            className={isReadOnly ? "pointer-events-none opacity-80" : ""} 
          />
          <InputField 
            label="Birthday" 
            name="Birthday" 
            value={formData.Birthday ? String(formData.Birthday).substring(0, 10) : ''}
            onChange={handleChange} 
            type="date" 
            required 
            className={isReadOnly ? "pointer-events-none opacity-80" : ""} 
          />
          <InputField label="Birthplace" name="BirthPlace" value={formData.BirthPlace || ''} onChange={handleChange} required className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <SelectField
            label="Sex"
            name="Sex"
            value={formData.Sex || 'Male'}
            onChange={handleChange}
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
            ]}
            className={isReadOnly ? "pointer-events-none opacity-80" : ""}
          />
          
          <InputField label="Contact Number" name="ContactNumber" value={formData.ContactNumber || ''} onChange={handleChange} type="tel" required className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <SelectField
            label="Civil Status"
            name="CivilStatus"
            value={formData.CivilStatus || ''}
            onChange={handleChange}
            required
            options={[
              { value: "", label: "Select..." },
              { value: "Single", label: "Single" },
              { value: "Married", label: "Married" },
              { value: "Widowed", label: "Widowed" },
              { value: "Divorced", label: "Divorced" },
            ]}
            className={isReadOnly ? "pointer-events-none opacity-80" : ""}
          />
          <InputField label="Religion" name="Religion" value={formData.Religion || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Citizenship" name="Citizenship" value={formData.Citizenship || ''} onChange={handleChange} required className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          
          <InputField label="City Address" name="CityAddress" value={formData.CityAddress || ''} onChange={handleChange} className={`md:col-span-2 ${isReadOnly ? "pointer-events-none opacity-80" : ""}`} required />
          <InputField label="Provincial Address" name="ProvincialAddress" value={formData.ProvincialAddress || ''} onChange={handleChange} className={`md:col-span-2 ${isReadOnly ? "pointer-events-none opacity-80" : ""}`} />
          <InputField label="Occupation" name="Occupation" value={formData.Occupation || ''} onChange={handleChange} className={`md:col-span-2 ${isReadOnly ? "pointer-events-none opacity-80" : ""}`} required />
        </div>
      </section>

      {/* Family Information */}
      <section>
        {sectionHeader("Family Information", Users)}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-4 font-bold text-xs text-slate-400 uppercase">Father&apos;s Info</div>
          <InputField label="Family Name" name="FatherFamilyName" value={formData.FatherFamilyName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Given Name" name="FatherGivenName" value={formData.FatherGivenName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Middle Name" name="FatherMiddleName" value={formData.FatherMiddleName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Contact" name="FatherContact" value={formData.FatherContact || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />

          <div className="lg:col-span-4 font-bold text-xs text-slate-400 uppercase mt-2">Mother&apos;s Info</div>
          <InputField label="Family Name" name="MotherFamilyName" value={formData.MotherFamilyName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Given Name" name="MotherGivenName" value={formData.MotherGivenName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Middle Name" name="MotherMiddleName" value={formData.MotherMiddleName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Contact" name="MotherContact" value={formData.MotherContact || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />

          <div className="lg:col-span-4 font-bold text-xs text-slate-400 uppercase mt-2">Spouse Info</div>
          <InputField label="Family Name" name="SpouseFamilyName" value={formData.SpouseFamilyName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Given Name" name="SpouseGivenName" value={formData.SpouseGivenName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Middle Name" name="SpouseMiddleName" value={formData.SpouseMiddleName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Contact" name="SpouseContact" value={formData.SpouseContact || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
        </div>
      </section>

      {/* Emergency & Responsible Party */}
      <section>
        {sectionHeader("Emergency & Billing", Phone)}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3 font-bold text-xs text-slate-400 uppercase">Emergency Contact</div>
          <InputField label="Contact Name" name="EmergencyContactName" value={formData.EmergencyContactName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Relation" name="EmergencyRelation" value={formData.EmergencyRelation || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Contact No." name="EmergencyContactNumber" value={formData.EmergencyContactNumber || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />

          <div className="lg:col-span-3 font-bold text-xs text-slate-400 uppercase mt-2">Responsible for Account</div>
          <InputField label="Name" name="ResponsibleName" value={formData.ResponsibleName || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Relation" name="ResponsibleRelation" value={formData.ResponsibleRelation || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Contact" name="ResponsibleContact" value={formData.ResponsibleContact || ''} onChange={handleChange} className={isReadOnly ? "pointer-events-none opacity-80" : ""} />
          <InputField label="Address" name="ResponsibleAddress" value={formData.ResponsibleAddress || ''} onChange={handleChange} className={`lg:col-span-3 ${isReadOnly ? "pointer-events-none opacity-80" : ""}`} />
        </div>
      </section>

      {/* Case Details */}
      <section>
        {sectionHeader("Admission Details", FileText)}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InputField label="Attending Physician" name="AttendingPhysician" value={formData.AttendingPhysician || ''} onChange={handleChange} className="lg:col-span-2" isReadOnly={isReadOnly} />
          
          <SelectField
            label="Service Case Type"
            name="ServiceCaseType"
            value={formData.ServiceCaseType || 'Private'}
            onChange={handleChange}
            options={[
              { value: "Private", label: "Private" },
              { value: "Charity", label: "Charity" },
              { value: "General", label: "General" },
              { value: "Package", label: "Package" },
              { value: "Project Case", label: "Project Case" },
            ]}
            isReadOnly={isReadOnly}
          />

          <SelectField
            label="Previously Admitted?"
            name="PreviouslyAdmitted"
            value={formData.PreviouslyAdmitted ? "Yes" : "No"}
            onChange={(e) => {
              const val = e.target.value === "Yes";
              if (onChange) {
                onChange({ target: { name: "PreviouslyAdmitted", value: val } } as unknown as React.ChangeEvent<HTMLInputElement>);
              }
            }}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
            isReadOnly={isReadOnly}
          />

          <SelectField
            label="PhilHealth Status"
            name="PhilHealthStatus"
            value={formData.PhilHealthStatus || 'None'}
            onChange={handleChange}
            options={[
              { value: "None", label: "None" },
              { value: "Member", label: "Member" },
              { value: "Dependent", label: "Dependent" },
              { value: "Mandatory", label: "Mandatory" },
            ]}
            isReadOnly={isReadOnly}
          />

          <SelectField
            label="VMC Benefit"
            name="VmcBenefit"
            value={formData.VmcBenefit || 'None'}
            onChange={handleChange}
            options={[
              { value: "None", label: "None" },
              { value: "Employee", label: "Employee" },
              { value: "Dependent", label: "Dependent" },
            ]}
            isReadOnly={isReadOnly}
          />

          <SelectField
            label="HMO Company?"
            name="HmoCompany"
            value={formData.HmoCompany ? "Yes" : "No"}
            onChange={(e) => {
              const val = e.target.value === "Yes";
              if (onChange) {
                onChange({ target: { name: "HmoCompany", value: val } } as unknown as React.ChangeEvent<HTMLInputElement>);
              }
            }}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
            isReadOnly={isReadOnly}
          />
          
          {formData.PreviouslyAdmitted && (
            <InputField 
              label="Previous Admission Date" 
              name="PreviousAdmissionDate" 
              type="date"
              value={formData.PreviousAdmissionDate ? (typeof formData.PreviousAdmissionDate === 'string' ? formData.PreviousAdmissionDate.substring(0, 10) : new Date(formData.PreviousAdmissionDate).toLocaleDateString('en-CA')) : ''} 
              onChange={handleChange} 
              isReadOnly={isReadOnly}
            />
          )}

          {formData.CreatedAt && (
            <>
              <InputField 
                label="Date of Admission" 
                name="CreatedAtDate" 
                value={new Date(formData.CreatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 
                isReadOnly={true}
                className="pointer-events-none opacity-80"
              />
              <InputField 
                label="Time of Admission" 
                name="CreatedAtTime" 
                value={new Date(formData.CreatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} 
                isReadOnly={true}
                className="pointer-events-none opacity-80"
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default PatientForm;
