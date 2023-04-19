export interface LeverCandidate {
  id: string;
  name: string;
  contact?: string;
  headline: string;
  stage: string;
  location?: string;
  phones?: (PhonesEntity)[] | null;
  emails?: (string)[] | null;
  links?: (string)[] | null;
  archived?: Archived;
  tags?: (string)[] | null;
  sources?: string[];
  origin: string;
  owner: any;
  followers?: (string)[] | null;
  applications?: (string)[] | null;
  createdAt: number;
  lastInteractionAt?: number;
  lastAdvancedAt?: number;
  snoozedUntil?: null;
  isAnonymized?: boolean;
  dataProtection?: null;
  postings?: string[];
  files?: string[];
}

export interface PhonesEntity {
  type: string;
  value: string;
}

export interface Archived {
  reason: string;
  archivedAt: number;
}

export interface Stage {
  id: string;
  text: string;
}

export interface Owner {
  id: string;
  name: string;
  username?: string;
  email?: string;
  accessRole?: string;
  photo?: string;
  createdAt: number;
  deactivatedAt?: null;
  externalDirectoryId?: null;
}

export interface StageChangesEntity {
  toStageId: string;
  toStageIndex: number;
  updatedAt: number;
  userId: string;
}

export interface Urls {
  list: string;
  show: string;
}

export enum Origin {
  agency = "agency",
  applied = "applied",
  internal = "internal",
  referred = "referred",
  sourced = "sourced",
  university = "university"
}
