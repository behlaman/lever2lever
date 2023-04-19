export class LeverOffer {
  id: string;
  posting: string;
  createdAt: number;
  status: string;
  creator: string;
  fields?: OfferFieldEntity[];
  signatures: Signatures;
  approved?: boolean;
  approvedAt?: number;
  sentAt?: null;
  customAction?: string;
  sentDocument?: sentDocument;
  signedDocument?: signedDocument;
}

export class OfferStatus {
  static approved = "approved";
  static signed = "signed";
}

export class sentDocument {
  fileName?: string;
  uploadedAt?: number;
  downloadUrl?: string;
}

export class signedDocument {
  fileName?: string;
  uploadedAt?: number;
  downloadUrl?: string;
}


export interface OfferFieldEntity {
  text: string;
  identifier: string;
  value?: string;
}

export interface Signatures {
}
