import {injectable} from "inversify";
import {In} from "typeorm";
import {differenceBy} from "lodash";
import {LeverDataRepository} from "../db/lever/LeverDataRepository";
import {LeverData} from "../domain/entities/lever2lever/LeverData";
import {LeverApiService} from "../../services/leverApiService";
import * as config from "config";

@injectable()
export class LeverSyncJob {

    async syncLeverOpp(): Promise<any> {
        let allOppData: any = [];
        let oppDataRecords = [];
        let count = 0;
        let limit: Number = 100;
        let page: number = 1;
        let offset: string = "";

        const leverApiService = new LeverApiService(config.get("lever.sourceKey"), true);

        try {
            do {
                allOppData = await leverApiService.listAllOpp(limit, offset, new Date("2023-03-15"));

                if (allOppData?.status !== 200 && allOppData?.data.data?.length === 0) return;

                offset = allOppData.data?.next ?? "";

                let leverIds = allOppData.data?.data.map((x) => x.id.toString());
                let filteredOpp = allOppData.data?.data.filter((x) => x.id !== null);

                const existingOpp = await LeverDataRepository.find({
                    where: {
                        oppLeverId: In(leverIds)
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
                    leverOppData.oppLeverId = leverOpp.id.toString();
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

                oppDataRecords = [];
                page++;
            } while (allOppData.data?.hasNext === true && allOppData.data?.next);
        } catch (e) {
            console.error(e, `Error while fetching data from lever: ${e.message}`);
        }
    }

    async getOppData(oppId: string): Promise<{
        notes: [],
        forms: [],
        feedback: [],
        resumes: [],
        offers: [],
        files: []
    }> {
        let obj: any = {
            notes: [], forms: [], feedback: [], resumes: [], offers: [], files: []
        };

        const leverApiService = new LeverApiService(config.get("lever.sourceKey"), true);

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


}