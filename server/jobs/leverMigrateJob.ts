import { LeverApiService } from "../../services/leverApiService";
import * as config from "config";
import { LeverDataRepository } from "../db/lever/LeverDataRepository";
import { Lever2leverMappingService } from "../../services/lever2leverMappingService";

export class LeverMigrateJob {
  async migrateOpportunities(): Promise<any> {

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

      await Lever2leverMappingService.mapOpportunity(opportunity);


    });

    await Promise.all(oppData);


  }


}