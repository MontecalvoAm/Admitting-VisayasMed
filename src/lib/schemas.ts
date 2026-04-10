import { z } from 'zod';

export const AdmitSchema = z.object({
  LastName: z.string().min(1, "Last name is required").max(100),
  GivenName: z.string().min(1, "Given name is required").max(100),
  MiddleName: z.string().max(100).optional().nullable(),
  Suffix: z.string().max(20).optional().nullable(),
  Birthday: z.string().refine((date) => !date || !isNaN(Date.parse(date)), { message: "Invalid date format" }).optional().nullable(),
  BirthPlace: z.string().max(200).optional().nullable(),
  Sex: z.enum(["Male", "Female", "Other", ""]).optional().nullable(),
  ContactNumber: z.string().max(50).optional().nullable(),
  CityAddress: z.string().max(255).optional().nullable(),
  ProvincialAddress: z.string().max(255).optional().nullable(),
  CivilStatus: z.string().max(50).optional().nullable(),
  Religion: z.string().max(100).optional().nullable(),
  Citizenship: z.string().max(100).optional().nullable(),
  Occupation: z.string().max(100).optional().nullable(),

  FatherFamilyName: z.string().max(100).optional().nullable(),
  FatherGivenName: z.string().max(100).optional().nullable(),
  FatherMiddleName: z.string().max(100).optional().nullable(),
  FatherContact: z.string().max(50).optional().nullable(),

  MotherFamilyName: z.string().max(100).optional().nullable(),
  MotherGivenName: z.string().max(100).optional().nullable(),
  MotherMiddleName: z.string().max(100).optional().nullable(),
  MotherContact: z.string().max(50).optional().nullable(),

  SpouseFamilyName: z.string().max(100).optional().nullable(),
  SpouseGivenName: z.string().max(100).optional().nullable(),
  SpouseMiddleName: z.string().max(100).optional().nullable(),
  SpouseContact: z.string().max(50).optional().nullable(),

  EmergencyContactName: z.string().max(200).optional().nullable(),
  EmergencyRelation: z.string().max(100).optional().nullable(),
  EmergencyContactNumber: z.string().max(50).optional().nullable(),

  ResponsibleName: z.string().max(200).optional().nullable(),
  ResponsibleContact: z.string().max(50).optional().nullable(),
  ResponsibleAddress: z.string().max(255).optional().nullable(),
  ResponsibleRelation: z.string().max(100).optional().nullable(),

  Age: z.coerce.number().int().min(0).max(150).optional().nullable(),
  AttendingPhysician: z.string().max(200).optional().nullable(),
  PreviouslyAdmitted: z.coerce.boolean().optional().nullable(),
  PreviousAdmissionDate: z.string().refine((date) => !date || !isNaN(Date.parse(date)), { message: "Invalid date format" }).optional().nullable(),
  PhilHealthStatus: z.string().max(50).optional().nullable(),
  HmoCompany: z.coerce.boolean().optional().nullable(),
  VmcBenefit: z.string().max(100).optional().nullable(),
  ServiceCaseType: z.string().max(200).optional().nullable(),
  
  PrintedNameSignature: z.string().max(200).optional().nullable(),
  RelationToPatientSignature: z.string().max(100).optional().nullable(),
  NameSignature2: z.string().max(200).optional().nullable()
});

export const UserSchema = z.object({
  FirstName: z.string().min(1, "First name is required").max(100),
  LastName: z.string().min(1, "Last name is required").max(100),
  Email: z.string().email("Invalid email format").max(255),
  RoleID: z.number().int().positive("Role ID must be valid"),
  Password: z.string().min(8, "Password must be at least 8 characters").optional(), // Optional for updates
});

export const PatientSchema = z.object({
  LastName: z.string().min(1, "Last name is required").max(100),
  GivenName: z.string().min(1, "Given name is required").max(100),
  Birthday: z.string().refine((date) => !date || !isNaN(Date.parse(date)), { message: "Invalid date format" }).optional().nullable(),
});

export type AdmitData = z.infer<typeof AdmitSchema>;
export type UserData = z.infer<typeof UserSchema>;
export type PatientData = z.infer<typeof PatientSchema>;
