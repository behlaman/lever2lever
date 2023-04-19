export class Offer {
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

export const getOfferField = function (offer: Offer, fieldIdentifier: string) {
  if (offer) {
    let field = offer.fields.find(x => x.identifier === fieldIdentifier);
    return field ? field.value : null;
  } else
    return undefined;
};

export const getOfferFieldByText = function (offer: Offer, fieldName: string) {
  if (offer) {
    let field = offer.fields.find(x => x.text === fieldName);
    return field ? field.value : null;
  } else
    return undefined;
};

export const getOfferFieldUsingText = function (offer: Offer, fieldName: string) {
  if (offer) {
    let field = offer.fields.find(x => x.text.toLowerCase() === fieldName.toLowerCase());
    return field ? field.value : null;
  } else
    return undefined;
};

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
