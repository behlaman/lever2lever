import {LeverCandidate} from "../server/domain/entities/lever/LeverCandidate";
import * as fs from "fs";
import csv = require("csvtojson/index");
import {id} from "inversify";


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


    // static async mapPostings(sourceOpp?: LeverCandidate, targetOpp?: LeverCandidate): Promise<any> {
    //
    //     let fileUrl = `./mapping/Lever_Postings.csv`;
    //     let readCsv = fs.readFileSync(fileUrl);
    //
    //     const csvContent = readCsv.toString("utf-8");
    //     let csvData = [];
    //
    //
    //     await csv()
    //         .fromString(csvContent)
    //         .subscribe((data) => {
    //             csvData.push(data);
    //         });
    //
    //     let testObj: any = {};
    //     csvData.map(x => testObj[x['Source Posting ID']] = x['Target Posting ID'])
    //
    //     console.log(testObj)
    //
    //
    //     targetOpp.postings = sourceOpp.postings.map(x => {
    //         let idObj = csvData.find(id => id['Source Posting ID'] === sourceOpp.postings[x]) ?? ""
    //         return idObj['Target Posting ID']
    //     })
    //
    // }
}