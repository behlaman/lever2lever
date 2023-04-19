import { injectable } from "inversify";
import { In } from "typeorm";
import { differenceBy } from "lodash";
import { LeverDataRepository } from "../db/lever/LeverDataRepository";
import { LeverData } from "../domain/entities/lever2lever/LeverData";
import { LeverApiService } from "../../services/leverApiService";
import Axios, { AxiosInstance } from "axios";
import * as fs from "fs";
import * as config from "config";

@injectable()
export class LeverSyncJob {

  private axios: AxiosInstance;

  constructor() {
    this.axios = Axios.create({
      headers: {
        "content-type": "application/json"
      }
    });
  }

  async syncLeverOpp(): Promise<any> {
    let allOppData: any = [];
    let oppDataRecords = [];
    let count = 0;
    let limit: Number = 100;
    let page: number = 1;
    let offset: string = "";

    const leverApiService = new LeverApiService(config.get("lever.sourceKey"));

    try {
      do {
        allOppData = await leverApiService.listAllOpp(limit, offset, new Date("2023-01-20"));

        if (allOppData?.status !== 200 && allOppData?.data.data?.length === 0) return;

        offset = allOppData.data?.next ?? "";

        let leverIds = allOppData.data?.data.map((x) => x.id.toString());
        let filteredOpp = allOppData.data?.data.filter((x) => x.id !== null);

        const existingOpp = await LeverDataRepository.find({
          where: {
            leverId: In(leverIds)
          }
        });

        const newOpp: any[] = differenceBy(
          filteredOpp,
          Array.from(existingOpp, (x) => x.recordData),
          "id"
        );

        for (const leverOpp of newOpp) {
          let oppData = await this.getOppData(leverOpp.id.toString());

          let leverOppData = new LeverData();
          leverOppData.leverId = leverOpp.id.toString();
          leverOppData.recordData = leverOpp;
          leverOppData.oppOwner = leverOpp.owner;
          leverOppData.offers = oppData.offers;
          leverOppData.notes = oppData.notes;
          leverOppData.resumes = oppData.resumes;
          leverOppData.profileForms = oppData.forms;
          leverOppData.otherFiles = oppData.files;
          leverOppData.feedbackForms = oppData.feedback;
          leverOppData.importDate = new Date();
          oppDataRecords.push(leverOppData);
        }

        await LeverDataRepository.save(oppDataRecords);

        count += oppDataRecords.length;

        console.log(`Exported ${count} Opportunities from lever`);

        console.log(`Downloading Files for ${count} opportunities`);

        oppDataRecords = [];
        page++;
      } while (allOppData.data?.hasNext === true && allOppData.data?.next);
    } catch (e) {
      console.error(e, `Error while fetching data from lever: ${e.message}`);
    }
  }

  async getOppData(oppId: string): Promise<{ notes: [], forms: [], feedback: [], resumes: [], offers: [], files: [] }> {
    let obj: any = {
      notes: [], forms: [], feedback: [], resumes: [], offers: [], files: []
    };

    const leverApiService = new LeverApiService(config.get("lever.sourceKey"));

    let oppData = await Promise.all(
      [leverApiService.getNotes(oppId), leverApiService.getFiles(oppId),
        leverApiService.getOffers(oppId), leverApiService.getFeedbackForm(oppId),
        leverApiService.getProfileForm(oppId), leverApiService.getResumes(oppId)]);

    obj.notes = oppData[0].status === 200 && oppData[0].data ? oppData[0].data : [];
    obj.files = oppData[1].status === 200 && oppData[1].data ? oppData[1].data : [];
    obj.offers = oppData[2].status === 200 && oppData[2].data ? oppData[2].data : [];
    obj.feedback = oppData[3].status === 200 && oppData[3].data ? oppData[3].data : [];
    obj.forms = oppData[4].status === 200 && oppData[4].data ? oppData[4].data : [];
    obj.resumes = oppData[5].status === 200 && oppData[5].data ? oppData[5].data : [];

    return obj;
  }

  async downloadOppFiles(): Promise<any> {
    let dir = `./temp/leverOppFiles`;
    await this.createDir(dir);

    try {
      let skipCount = 0;
      let processBatch;
      let fileDownloadCount = 0;

      do {
        processBatch = await LeverDataRepository.find({
          skip: skipCount,
          take: 3
        });

        const filesDownloadPromise = processBatch.map(async (opp, idx: number) => {
          const resumeFilesDir = `${dir}/resumes/${opp.leverId}-${idx}`;
          const offerDir = `${dir}/offers/${opp.leverId}-${idx}`;
          const otherFilesDir = `${dir}/otherFiles/${opp.leverId}-${idx}`;

          let downloadFiles = [];

          let resumeIds = opp.resumes.map(x => x.id);
          if (resumeIds.length > 0)
            downloadFiles.push(this.downloadResumes(opp.leverId, resumeIds, resumeFilesDir));

          let offerIds = opp?.offers.map(x => x.id);
          if (offerIds.length > 0)
            downloadFiles.push(this.downloadOffers(opp.leverId, offerIds, offerDir));

          let otherOppFileIds = opp?.otherFiles.map(x => x.id);
          if (otherOppFileIds.length > 0)
            downloadFiles.push(this.downloadFiles(opp.leverId, otherOppFileIds, otherFilesDir));


          await Promise.all(downloadFiles);
          fileDownloadCount += downloadFiles.length;

          console.log(`Downloaded ${fileDownloadCount} files`);
        });

        await Promise.all(filesDownloadPromise);
        skipCount += 3;

      } while (processBatch.length === 3);

      console.log(`Downloaded Files`);

    } catch (e) {
      console.error(e, e.message);
    }
  }

  async createDir(directory: string): Promise<any> {
    let fileTypes = ["resumes", "offers", "otherFiles"];

    fileTypes.forEach(file => {
      const dir = `${directory}/${file}`;

      // we are deleting the respective client directory if already exists for a new import job.
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
      }

      fs.mkdirSync(dir, { recursive: true });
    });
  }

  async downloadResumes(oppId: string, resumeIds: string[], dir: string): Promise<any> {
    const leverApiService = new LeverApiService(config.get("lever.sourceKey"));

    for (const resumeId of resumeIds) {
      let response = await leverApiService.downloadResumes(oppId, resumeId);

      if (response?.status === 200 && response?.data) {
        let writeStream = fs.createWriteStream(dir);
        response?.data.pipe(writeStream);

        await new Promise((resolve) => {
          writeStream.on("finish", () => {
            writeStream.end();
            resolve(true);
          });
        });
      } else {
        console.log(response.data);
      }
    }
  }

  async downloadOffers(oppId: string, offerIds: string[], dir: string): Promise<any> {
    const leverApiService = new LeverApiService(config.get("lever.sourceKey"));

    for (const offerId of offerIds) {
      let offerResponse = await leverApiService.downloadOfferFile(oppId, offerId);

      if (offerResponse?.status === 200 && offerResponse?.data) {
        let writeStream = fs.createWriteStream(dir);
        offerResponse?.data.pipe(writeStream);

        await new Promise((resolve) => {
          writeStream.on("finish", () => {
            writeStream.end();
            resolve(true);
          });
        });
      } else {
        console.log(offerResponse.data);
      }
    }
  }

  async downloadFiles(oppId: string, otherFilesIds: string[], dir: string): Promise<any> {
    const leverApiService = new LeverApiService(config.get("lever.sourceKey"));

    for (const otherFilesId of otherFilesIds) {
      let fileRes = await leverApiService.downloadFiles(oppId, otherFilesId);

      if (fileRes?.status === 200 && fileRes?.data) {
        let writeStream = fs.createWriteStream(dir);
        fileRes?.data.pipe(writeStream);

        await new Promise((resolve) => {
          writeStream.on("finish", () => {
            writeStream.end();
            resolve(true);
          });
        });
      } else {
        console.log(fileRes.data);
      }
    }
  }
}