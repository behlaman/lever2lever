import { LeverCandidate } from "../server/domain/entities/lever/LeverCandidate";


export class Lever2leverMappingService {

  static async mapOpportunity(opportunity: LeverCandidate): Promise<LeverCandidate> {


    let targetOpp = {} as LeverCandidate;

    targetOpp.name = opportunity.name;

    let emails = [];
    for (let i = 0; i < opportunity.emails.length; i++) {
      emails.push(opportunity.emails[i]);
    }

    targetOpp.emails = emails;

    targetOpp.location = opportunity.location;

    let links = [];
    for (let i = 0; i < opportunity.links.length; i++) {
      links.push(opportunity.links[i]);
    }

    targetOpp.links = links;

    targetOpp.headline = opportunity.headline;

    targetOpp.createdAt = opportunity.createdAt;

    targetOpp.origin = opportunity.origin;

    let sources = [];

    for (let i = 0; i < opportunity.sources.length; i++) {
      sources.push(opportunity.sources);
    }

    targetOpp.sources = sources;

    targetOpp.owner = opportunity?.owner?.email ?? "yuya.harada@woven-planet.global";

    let tags = [];

    for (let i = 0; i < opportunity.tags.length; i++) {
      tags.push(opportunity.tags, `Referral by ${opportunity.owner.email}`);
    }

    targetOpp.tags = tags;



    return;
  }

}