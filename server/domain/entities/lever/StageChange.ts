export class StageChange {
  id: string;
  event: string;
  data: StageData;
  signature: string;
  triggeredAt: string;
  token: string;
}

export class StageData {
  candidateId: string;
  fromStageId: string;
  toStageId: string;
  opportunityId: string;
  contactId: string;
}


