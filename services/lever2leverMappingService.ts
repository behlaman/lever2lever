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
            if (opportunity?.phones[i]?.value.includes("\u0000")) {
                opportunity?.phones[i]?.value.replace("\u0000", "")
            }
        }

        targetOpp.phones = opportunity.phones;

        targetOpp.links = opportunity.links;

        targetOpp.headline = opportunity.headline;

        targetOpp.createdAt = opportunity.createdAt;

        targetOpp.origin = opportunity.origin;

        targetOpp.sources = opportunity.sources;

        targetOpp.owner = ownerId;

        targetOpp.tags = opportunity.tags;

        targetOpp.tags.push(`Referral by ${opportunity.owner?.email}`)

        targetOpp.stage = stage;

        targetOpp.archived = {
            reason: oppArchived,
            archivedAt: opportunity?.archived?.archivedAt ?? null
        };

        targetOpp.postings = postingIds ?? [];

        return targetOpp;
    }
}