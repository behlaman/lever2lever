import {LeverCandidate} from "../server/domain/entities/lever/LeverCandidate";

export class Lever2leverMappingService {

    static async mapOpportunity(opportunity: LeverCandidate,
                                postingIds: string[],
                                stage: string, oppArchived: string, ownerId: string): Promise<LeverCandidate> {


        let targetOpp = {} as LeverCandidate;

        targetOpp.name = opportunity.name;

        targetOpp.emails = opportunity.emails;

        targetOpp.location = opportunity.location;

        for (let i = 0; i < opportunity?.phones?.length; i++) {
            opportunity?.phones[i]?.value.includes("\u001b") ? opportunity?.phones[i]?.value.replace(/[^a-zA-Z0-9.]+/g, "") : opportunity?.phones[i]?.value
        }

        targetOpp.phones = opportunity.phones;

        targetOpp.links = opportunity.links;

        targetOpp.headline = opportunity.headline;

        // we are subtracting 24 hrs if createdAt > archivedAt
        targetOpp.createdAt = opportunity.createdAt > opportunity.archived?.archivedAt ? (opportunity?.createdAt - 86400000) : opportunity.createdAt

        targetOpp.origin = opportunity.origin;

        targetOpp.sources = opportunity.sources;

        targetOpp.owner = ownerId;

        targetOpp.tags = opportunity.tags;

        targetOpp.tags.push(`Referral by ${opportunity.owner?.email}`)

        targetOpp.stage = stage;

        targetOpp.archived = {
            reason: oppArchived,
            archivedAt: opportunity?.createdAt < opportunity?.archived?.archivedAt ? opportunity?.archived?.archivedAt : new Date().valueOf()
        };

        targetOpp.postings = postingIds ?? [];

        return targetOpp;
    }
}