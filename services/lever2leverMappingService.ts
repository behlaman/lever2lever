import {LeverCandidate} from "../server/domain/entities/lever/LeverCandidate";

export class Lever2leverMappingService {

    static async mapOpportunity(opportunity: LeverCandidate,
                                postingIds: string[],
                                stage: string, oppArchived: string, ownerId: string): Promise<LeverCandidate> {


        let targetOpp = {} as LeverCandidate;

        targetOpp.name = opportunity.name;


        const domains = ["allegisgroup.com",
            "embarc.co.jp",
            "4th-valley.com",
            "hccr.com",
            "heidrick.com",
            "hrnetone.com",
            "jac-recruitment.jp",
            "optms.jp",
            "randstad.co.jp",
            "recruiterroom.com",
            "rgf-executive.com",
            "roberthalf.jp",
            "robertwalters.co.jp",
            "source-edge.com",
            "cornerstone.jp",
            "e-board.jp",
            "itsfearless.com",
            "hays.co.jp",
            "jsource.co.jp",
            "jobslab.io",
            "m-next.jp",
            "metiercareers.co.jp",
            "moback.com",
            "wilsonhcg.com",
            "rgf-professional.com",
            "r-agent.com",
            "skillhouse.co.jp",
            "turnpoint-consulting.com",
            "ryo.takahashi@tri-ad.global"]

        let emails = []
        domains.forEach(domain => {
            emails.push(...opportunity.emails.filter(x => (x.includes(domain))))
        })

        let filteredEmails = []

        filteredEmails = emails ? opportunity.emails.filter(x => (!emails.includes(x))) : []

        console.log(filteredEmails);

        targetOpp.emails = filteredEmails;

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