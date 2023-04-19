import {LeverApiService} from "../../services/leverApiService";
import * as config from "config";
import {LeverDataRepository} from "../db/lever/LeverDataRepository";
import {Lever2leverMappingService} from "../../services/lever2leverMappingService";
import * as fs from "fs";
import csv = require("csvtojson/index");

export class LeverMigrateJob {
    async migrateOpportunities(): Promise<any> {


        let data = await this.parseCsv()


        const leverApiService = new LeverApiService(config.get("lever.targetKey"));

        let skip = 0;
        let take: number = 5;

        const leverData = await LeverDataRepository.find({
            skip: skip,
            take: take
        });

        const oppData: any[] = leverData.flatMap(async x => {

            const resume = x.resumes;
            const offer = x.offers;
            const otherFile = x.otherFiles;
            const note = x.notes;
            const opportunity: any = x.recordData;

            const postingId = opportunity.postings

            await Lever2leverMappingService.mapOpportunity(opportunity);


        });

        await Promise.all(oppData);


    }

    async parseCsv(): Promise<any> {
        let csvPath: string[] = [`./mapping/Lever_Postings.csv`, `./mapping/Lever_archiveReasons.csv`, `./mapping/Lever_Stages.csv`];

        const csvPromise = csvPath.map(async csv1 => {
            let readCsv = fs.readFileSync(csv1);

            const csvContent = readCsv.toString("utf-8");

            let csvData = [];

            await csv()
                .fromString(csvContent)
                .subscribe((data) => {
                    csvData.push(data);
                });


            let testObj: any = {};
            csvData.map(x => testObj[x['SourceId']] = x['TargetId'])

            return testObj
        });

        let data = await Promise.all(csvPromise)

        return {
            postings: data[0],
            archiveReasons: data[1],
            stages: data[2]
        }

    }
}