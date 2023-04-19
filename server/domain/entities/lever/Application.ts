import {Form} from "./Form";

export interface Application {
  id: string;
  type: string;
  candidateId: string;
  posting: string;
  postingHiringManager: string;
  postingOwner: string;
  name?: null;
  company?: null;
  phone?: null;
  email?: null;
  links?: (null)[] | null;
  comments?: null;
  user: string;
  customQuestions?: (Form)[] | null;
  createdAt: number;
  archived: Archived;
  requisitionForHire: RequisitionForHire;
}

export interface Archived {
  reason: string;
  archivedAt: number;
}

export interface RequisitionForHire {
  id: string;
  requisitionCode: string;
  hiringManagerOnHire: string;
}
