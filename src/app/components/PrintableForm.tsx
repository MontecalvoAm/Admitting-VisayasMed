"use client";

import React from "react";
import Image from "next/image";

interface PrintableFormProps {
  // Accepts both the fully-typed admission record and the dynamic Record<string, string>
  // produced by the schema-driven homepage form.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: Record<string, any>;
}

/* ─── Shared inline style objects ─── */
const S = {
  cell: {
    border: "1px solid #bcc5d3",
    padding: "1px 5px",
    minHeight: "22px",
  } as React.CSSProperties,
  cellLabel: {
    display: "block",
    fontSize: "7.5px",
    fontWeight: 700,
    color: "#6b7a8d",
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
    lineHeight: 1.2,
  } as React.CSSProperties,
  cellValue: {
    display: "block",
    fontSize: "11px",
    color: "#111827",
    fontWeight: 500,
    minHeight: "14px",
    lineHeight: 1.3,
  } as React.CSSProperties,
  sectionHeader: {
    fontSize: "9px",
    fontWeight: 700,
    color: "#ffffff",
    textTransform: "uppercase" as const,
    letterSpacing: "0.6px",
    padding: "2px 8px",
    background: "#1e3a5f",
    margin: 0,
    WebkitPrintColorAdjust: "exact" as const,
    printColorAdjust: "exact" as const,
  } as React.CSSProperties,
  grid: (cols: number) =>
    ({
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 0,
    }) as React.CSSProperties,
  checkbox: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "12px",
    height: "12px",
    border: "1px solid #1e3a5f",
    borderRadius: "2.5px",
    fontSize: "9px",
    lineHeight: 1,
    flexShrink: 0,
    marginRight: "4px",
    transition: "all 0.2s ease",
  } as React.CSSProperties,
  checkLabel: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "9px",
    color: "#222",
    marginRight: "10px",
  } as React.CSSProperties,
};

/* ─── Helper Components ─── */
function Cell({
  label,
  value,
  colSpan,
}: {
  label: string;
  value?: string;
  colSpan?: number;
}) {
  const style = colSpan
    ? { ...S.cell, gridColumn: `span ${colSpan}` }
    : S.cell;
  return (
    <div style={style}>
      <span style={S.cellLabel}>{label}</span>
      <span style={S.cellValue}>{value || "\u00A0"}</span>
    </div>
  );
}

function CheckOption({ label, checked }: { label: string, checked?: boolean }) {
  return (
    <span style={S.checkLabel}>
      <span style={{
        ...S.checkbox,
        backgroundColor: checked ? "#1e3a5f" : "transparent",
        color: "#ffffff",
        borderColor: "#1e3a5f",
        fontWeight: 900,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact"
      }}>
        {checked ? '✓' : ''}
      </span>
      {label}
    </span>
  );
}

function SectionHeader({
  children,
  note,
}: {
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div style={S.sectionHeader}>
      {children}
      {note && (
        <span
          style={{
            fontWeight: 400,
            fontStyle: "italic",
            fontSize: "7.5px",
            color: "#a0b0c0",
            marginLeft: "6px",
          }}
        >
          {note}
        </span>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function PrintableForm({ formData }: PrintableFormProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const fatherName = [
    formData.FatherFamilyName,
    formData.FatherGivenName,
    formData.FatherMiddleName,
  ]
    .filter(Boolean)
    .join(", ");

  const motherName = [
    formData.MotherFamilyName,
    formData.MotherGivenName,
    formData.MotherMiddleName,
  ]
    .filter(Boolean)
    .join(", ");

  const spouseName = [
    formData.SpouseFamilyName,
    formData.SpouseGivenName,
    formData.SpouseMiddleName,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="printable-form-wrapper">
      {/* ────── THE PRINTABLE DOCUMENT ────── */}
      <div
        className="printable-form"
        id="printable-form"
        style={{
          background: "#ffffff",
          color: "#111827",
          fontSize: "10.5px",
          lineHeight: 1.3,
          maxWidth: "840px",
          margin: "0 auto",
          padding: "4px 18px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
          WebkitPrintColorAdjust: "exact" as const,
          printColorAdjust: "exact" as const,
          position: "relative",
          overflow: "hidden",
          minHeight: "25.7cm", // Fixed height to fill the Letter page and push footer to bottom
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ─── Global Background Watermark ─── */}
        <div style={{ 
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)", 
          zIndex: 0, 
          opacity: 0.25,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Image
            src="/Visayas Medical.png"
            alt="VisayasMed Hospital Watermark"
            width={1300}
            height={1300}
            style={{ width: "1300px", height: "1300px", objectFit: "contain" }}
          />
        </div>

        {/* ─── Hospital Header ─── */}
        <div style={{ textAlign: "center", marginBottom: "0", position: "relative", zIndex: 1, minHeight: "85px", display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: "4px" }}>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 900,
              color: "#1a365d", // Deeper corporate blue
              letterSpacing: "4px",
              margin: "2px 0 0",
              lineHeight: 1.1,
              textTransform: "uppercase",
            }}
          >
            VISAYASMED HOSPITAL
          </h1>
          <p
            style={{
              fontSize: "8.5px",
              fontWeight: 700,
              color: "#4a5568", // Professional gray
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              margin: "0 0 4px",
            }}
          >
            A MEMBER OF APPLEONE MEDICAL GROUP
          </p>
          <div style={{ fontSize: "8.5px", color: "#718096", lineHeight: 1.4, maxWidth: "450px", margin: "0 auto" }}>
            <p style={{ margin: 0 }}>85 Osmeña Blvd., Brgy. Sta. Cruz, Cebu City, Philippines 6000</p>
            <p style={{ margin: 0 }}>Tel: (032) 253 1901 • www.visayasmedcebu.com.ph</p>
          </div>
        </div>

        {/* Header Separation Line - Professional single line */}
        <div style={{ borderTop: "2.0px solid #1e3a5f", margin: "2px 0 0" }} />

        <h2
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "#1e3a5f",
            letterSpacing: "2px",
            margin: "0 0 4px",
            textTransform: "uppercase",
            textAlign: "center",
            width: "100%"
          }}
        >
          Admitting Patient Information
        </h2>

        {(() => {
          if (!isMounted || formData.isEmptyForm) return <div style={S.grid(3)}><Cell label="Date of Admission" value="" /><Cell label="Time of Admission" value="" /><Cell label="Room Number" value="" /></div>;
          
          // Use CreatedAt if available, otherwise fallback to current date (for new unsaved forms)
          const admissionDate = formData.CreatedAt ? new Date(formData.CreatedAt) : new Date();
          
          const datePart = admissionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          const timePart = `${admissionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })} ${admissionDate.toLocaleDateString('en-US', { weekday: 'long' })}`;
          
          return (
            <div style={S.grid(3)}>
              <Cell label="Date of Admission" value={datePart} />
              <Cell label="Time of Admission" value={timePart} />
              <Cell label="Room Number" value="" />
            </div>
          );
        })()}

        {/* ─── 1. Patient Information ─── */}
        <div style={{ marginTop: "5px" }}>
          <SectionHeader>1. Patient Information</SectionHeader>
          <div style={S.grid(4)}>
            <Cell label="Last Name" value={formData.LastName} />
            <Cell label="Given Name" value={formData.GivenName} />
            <Cell label="Middle Name" value={formData.MiddleName} />
            <Cell label="Suffix" value={formData.Suffix} />
          </div>
          <div style={S.grid(4)}>
            <Cell label="Age" value={formData.Age} />
            <Cell label="Birthday" value={formData.Birthday ? new Date(formData.Birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''} />
            <Cell label="Birthplace" value={formData.BirthPlace} />
            <Cell label="Sex" value={formData.Sex} />
          </div>
          <div style={S.grid(4)}>
            <Cell label="Contact Number" value={formData.ContactNumber} />
            <Cell label="Civil Status" value={formData.CivilStatus} />
            <Cell label="Religion" value={formData.Religion} />
            <Cell label="Citizenship" value={formData.Citizenship} />
          </div>
          <div style={S.grid(2)}>
            <Cell label="City / Local Address" value={formData.CityAddress} />
            <Cell label="Provincial Address" value={formData.ProvincialAddress} />
          </div>
          <div style={S.grid(2)}>
            <Cell label="Occupation" value={formData.Occupation} />
            <Cell label="" value="" />
          </div>
        </div>

        {/* ─── 2. Family & Relatives ─── */}
        <div style={{ marginTop: "10px" }}>
          <SectionHeader>2. Family &amp; Relatives</SectionHeader>
          <div style={S.grid(2)}>
            <Cell label="Father's Name" value={fatherName} />
            <Cell label="Contact No." value={formData.FatherContact} />
          </div>
          <div style={S.grid(2)}>
            <Cell label="Mother's Maiden Name" value={motherName} />
            <Cell label="Contact No." value={formData.MotherContact} />
          </div>
          <div style={S.grid(2)}>
            <Cell label="Spouse Name" value={spouseName} />
            <Cell label="Contact No." value={formData.SpouseContact} />
          </div>
        </div>

        {/* ─── 3. Emergency Contact ─── */}
        <div style={{ marginTop: "10px" }}>
          <SectionHeader>3. Emergency Contact</SectionHeader>
          <div style={S.grid(3)}>
            <Cell label="Contact Name" value={formData.EmergencyContactName} />
            <Cell label="Relation to Patient" value={formData.EmergencyRelation} />
            <Cell label="Contact Number" value={formData.EmergencyContactNumber} />
          </div>
        </div>

        {/* ─── 4. Responsible for Account ─── */}
        <div style={{ marginTop: "10px" }}>
          <SectionHeader>4. Responsible for Account</SectionHeader>
          <div style={S.grid(3)}>
            <Cell label="Name" value={formData.ResponsibleName} />
            <Cell label="Relation" value={formData.ResponsibleRelation} />
            <Cell label="Contact Number" value={formData.ResponsibleContact} />
          </div>
          <div style={S.grid(1)}>
            <Cell label="Address" value={formData.ResponsibleAddress} />
          </div>
        </div>

        {/* ─── 5. Admission Details (Staff Only) ─── */}
        <div style={{ marginTop: "10px" }}>
          <SectionHeader note="(For Admitting Staff Use Only)">
            5. Admission Details
          </SectionHeader>
          <div style={S.grid(2)}>
            <div style={{ ...S.cell, minHeight: "44px" }}>
              <span style={S.cellLabel}>Attending Physician</span>
              <span style={{ ...S.cellValue, marginTop: "8px", fontSize: "12px", borderBottom: "1px solid #1e3a5f" }}>
                {formData.AttendingPhysician || "\u00A0"}
              </span>
            </div>
            <div style={{ ...S.cell, minHeight: "44px" }}>
              <span style={S.cellLabel}>Previously Admitted?</span>
              <div style={{ display: "flex", alignItems: "center", paddingTop: "2px" }}>
                <CheckOption 
                  label="Yes" 
                  checked={formData.PreviouslyAdmitted === true || formData.PreviouslyAdmitted === "true" || (formData.AdmissionCount && Number(formData.AdmissionCount) > 1)} 
                />
                <CheckOption 
                  label="No" 
                  checked={!formData.isEmptyForm && formData.PreviouslyAdmitted !== true && formData.PreviouslyAdmitted !== "true" && (!formData.AdmissionCount || Number(formData.AdmissionCount) <= 1)} 
                />
                <span style={{ fontSize: "8px", color: "#888", marginLeft: "8px" }}>
                  If yes, Date: {formData.PreviousAdmissionDate && !formData.isEmptyForm ? new Date(formData.PreviousAdmissionDate).toLocaleDateString() : "_______________"}
                </span>
              </div>
            </div>
          </div>
          <div style={S.grid(3)}>
            <div style={S.cell}>
              <span style={S.cellLabel}>PhilHealth Status</span>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", paddingTop: "2px" }}>
                <CheckOption label="Member" checked={formData.PhilHealthStatus === 'Member'} />
                <CheckOption label="Dependent" checked={formData.PhilHealthStatus === 'Dependent'} />
                <CheckOption label="Mandatory" checked={formData.PhilHealthStatus === 'Mandatory'} />
                <CheckOption label="None" checked={!formData.isEmptyForm && (formData.PhilHealthStatus === 'None' || !formData.PhilHealthStatus)} />
              </div>
            </div>
            <div style={S.cell}>
              <span style={S.cellLabel}>VMC Benefit</span>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", paddingTop: "2px" }}>
                <CheckOption label="Employee" checked={formData.VmcBenefit === 'Employee'} />
                <CheckOption label="Dependent" checked={formData.VmcBenefit === 'Dependent'} />
                <CheckOption label="None" checked={!formData.isEmptyForm && (formData.VmcBenefit === 'None' || !formData.VmcBenefit)} />
              </div>
            </div>
            <div style={S.cell}>
              <span style={S.cellLabel}>HMO Company?</span>
              <div style={{ display: "flex", alignItems: "center", paddingTop: "2px" }}>
                <CheckOption label="Yes" checked={formData.HmoCompany === true} />
                <CheckOption label="No" checked={!formData.isEmptyForm && (formData.HmoCompany === false || formData.HmoCompany === undefined)} />
              </div>
            </div>
          </div>
          <div style={S.grid(1)}>
            <div style={S.cell}>
              <span style={S.cellLabel}>Service Case Type</span>
              <div style={{ display: "flex", alignItems: "center", paddingTop: "2px" }}>
                <CheckOption label="Private" checked={formData.ServiceCaseType === 'Private'} />
                <CheckOption label="House Case" checked={formData.ServiceCaseType === 'House Case'} />
                <CheckOption label="Charity / Package" checked={formData.ServiceCaseType === 'Charity' || formData.ServiceCaseType === 'Package'} />
                <CheckOption label="Project Case" checked={formData.ServiceCaseType === 'Project Case'} />
              </div>
            </div>
          </div>
        </div>

        {/* ─── 6. Confirmation & Signature ─── */}
        <div style={{ marginTop: "10px" }}>
          <SectionHeader>6. Confirmation &amp; Signature</SectionHeader>
          <div
            style={{
              fontSize: "8px",
              fontStyle: "italic",
              color: "#4b5563",
              padding: "3px 8px",
              borderLeft: "1px solid #bcc5d3",
              borderRight: "1px solid #bcc5d3",
              lineHeight: 1.3,
            }}
          >
            I hereby agree that all information entered above is true and correct to the best of
            my knowledge. I understand that providing false information may result in the delay or denial of admission services.
          </div>
          {/* Signature lines */}
          <div style={S.grid(3)}>
            <div style={{ ...S.cell, minHeight: "55px", display: "flex", flexDirection: "column" }}>
              <span style={S.cellLabel}>Signature</span>
              <div style={{ marginTop: "auto", textAlign: "center", width: "95%" }}>
                <span style={{ ...S.cellValue, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px" }}>
                  {formData.ResponsibleName || "\u00A0"}
                </span>
                <div style={{ borderBottom: "1.5px solid #111827", width: "100%" }} />
                <span style={{ fontSize: "7px", color: "#4b5563", fontWeight: 700, display: "block", textTransform: "uppercase", letterSpacing: "0.3px", marginTop: "1px" }}>
                  Signature over Printed Name
                </span>
              </div>
            </div>
            <div style={{ ...S.cell, minHeight: "55px" }}>
              <span style={S.cellLabel}>Relation to Patient</span>
              <span style={{ ...S.cellValue, marginTop: "16px", fontSize: "11.5px" }}>
                {formData.ResponsibleRelation || "\u00A0"}
              </span>
            </div>
            <div style={{ ...S.cell, minHeight: "55px" }}>
              <span style={S.cellLabel}>Date Signed</span>
              <span style={{ ...S.cellValue, marginTop: "16px", fontSize: "11.5px" }}>
                {isMounted && !formData.isEmptyForm ? new Date().toLocaleDateString() : "\u00A0"}
              </span>
            </div>
          </div>
        </div>

        {/* ─── 7. Admitting Clerk Verification ─── */}
        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", paddingRight: "10px" }}>
          <div style={{ display: "flex", gap: "40px", alignItems: "flex-end" }}>
            <div style={{ width: "220px" }}>
              <span style={S.cellLabel}>Verified by Admitting Clerk</span>
              <div style={{ borderBottom: "1.5px solid #111827", marginTop: "28px", width: "100%" }} />
              <span style={{ fontSize: "7.5px", color: "#4b5563", fontWeight: 700, display: "block", marginTop: "4px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.5px" }}>Signature over Printed Name</span>
            </div>
            <div style={{ width: "140px" }}>
              <span style={S.cellLabel}>Date Verified</span>
              <div style={{ borderBottom: "1.5px solid #111827", marginTop: "28px", width: "100%" }} />
              <div style={{ height: "14px" }} /* Spacer for alignment with the signature label */ />
            </div>
          </div>
        </div>

        {/* ─── Professional Footer ─── */}
        <div
          style={{
            marginTop: "auto",
            borderTop: "1.5px solid #1e3a5f",
            paddingTop: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "7px",
            color: "#374151", // Darker for clarity
            lineHeight: 1.4,
            paddingBottom: "4px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.5px" }}>VisayasMed Hospital</div>
            <div style={{ fontWeight: 500 }}>Form No. VMH-ADM-001 • Rev. 2026</div>
          </div>
          <div style={{ flex: 2, textAlign: "center", padding: "0 10px", fontStyle: "italic", fontSize: "6.5px", fontWeight: 500 }}>
            This document contains confidential patient information protected under the Data Privacy Act of 2012 (R.A. 10173).
            Unauthorized disclosure is strictly prohibited.
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ fontWeight: 700 }}>Page 1 of 1</div>
            <div style={{ fontSize: "5.5px", marginTop: "1px", color: "#6b7280" }}>Generated on {isMounted ? new Date().toLocaleString() : ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

