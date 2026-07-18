import { z } from 'zod';

export const MedicationSchema = z.object({
  name: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
});

export const LabTestSchema = z.object({
  name: z.string().optional(),
  value: z.string().optional(),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
});

export const BillingItemSchema = z.object({
  description: z.string().optional(),
  amount: z.number().optional(),
});

export const PrescriptionSchema = z.object({
  documentType: z.literal('prescription'),
  confidence: z.number().min(0).max(1),
  doctorName: z.string().optional(),
  hospitalName: z.string().optional(),
  visitDate: z.string().optional(),
  diagnosis: z.array(z.string()).optional(),
  medications: z.array(MedicationSchema).optional(),
  rawText: z.string().optional(),
});

export const LabReportSchema = z.object({
  documentType: z.literal('lab_report'),
  confidence: z.number().min(0).max(1),
  doctorName: z.string().optional(),
  hospitalName: z.string().optional(),
  visitDate: z.string().optional(),
  labTests: z.array(LabTestSchema).optional(),
  rawText: z.string().optional(),
});

export const ScanReportSchema = z.object({
  documentType: z.literal('scan_report'),
  confidence: z.number().min(0).max(1),
  doctorName: z.string().optional(),
  hospitalName: z.string().optional(),
  visitDate: z.string().optional(),
  findings: z.string().optional(),
  impression: z.string().optional(),
  rawText: z.string().optional(),
});

export const BillSchema = z.object({
  documentType: z.literal('bill'),
  confidence: z.number().min(0).max(1),
  hospitalName: z.string().optional(),
  visitDate: z.string().optional(),
  totalAmount: z.number().optional(),
  items: z.array(BillingItemSchema).optional(),
  rawText: z.string().optional(),
});

export const DischargeSummarySchema = z.object({
  documentType: z.literal('discharge_summary'),
  confidence: z.number().min(0).max(1),
  doctorName: z.string().optional(),
  hospitalName: z.string().optional(),
  admissionDate: z.string().optional(),
  dischargeDate: z.string().optional(),
  diagnosis: z.array(z.string()).optional(),
  medications: z.array(MedicationSchema).optional(),
  followUpDate: z.string().optional(),
  rawText: z.string().optional(),
});

export const VaccinationRecordSchema = z.object({
  documentType: z.literal('vaccination_record'),
  confidence: z.number().min(0).max(1),
  vaccineName: z.string().optional(),
  administeredDate: z.string().optional(),
  administeredBy: z.string().optional(),
  rawText: z.string().optional(),
});

export const InsuranceSchema = z.object({
  documentType: z.literal('insurance'),
  confidence: z.number().min(0).max(1),
  providerName: z.string().optional(),
  policyNumber: z.string().optional(),
  validUntil: z.string().optional(),
  rawText: z.string().optional(),
});

export const GenericDocumentSchema = z.object({
  documentType: z.literal('generic'),
  confidence: z.number().min(0).max(1),
  doctorName: z.string().optional(),
  hospitalName: z.string().optional(),
  visitDate: z.string().optional(),
  diagnosis: z.array(z.string()).optional(),
  medications: z.array(MedicationSchema).optional(),
  labTests: z.array(LabTestSchema).optional(),
  rawText: z.string().optional(),
});

export const ExtractedEntitiesSchema = z.discriminatedUnion('documentType', [
  PrescriptionSchema,
  LabReportSchema,
  ScanReportSchema,
  BillSchema,
  DischargeSummarySchema,
  VaccinationRecordSchema,
  InsuranceSchema,
  GenericDocumentSchema,
]);

export type ExtractedEntities = z.infer<typeof ExtractedEntitiesSchema>;

export interface ExtractionResult {
  documentType: string;
  confidence: number;
  entities: ExtractedEntities;
  rawText?: string;
}

export interface IExtractorProvider {
  extract(
    documentId: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<ExtractionResult>;
}
