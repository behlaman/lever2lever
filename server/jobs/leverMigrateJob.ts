import {LeverApiService} from "../../services/leverApiService";
import * as config from "config";
import {LeverDataRepository} from "../db/lever/LeverDataRepository";
import {Lever2leverMappingService} from "../../services/lever2leverMappingService";
import * as fs from "fs";
import {LeverData} from "../domain/entities/lever2lever/LeverData";
import csv = require("csvtojson/index");
import {LeverCandidate} from "../domain/entities/lever/LeverCandidate";

export class LeverMigrateJob {
    async migrateOpportunities(): Promise<any> {
        let dir = `./temp/leverOppFiles`;
        await this.createDir(dir);

        let data = await this.parseCsv()

        const leverApiService = new LeverApiService("", false, true);
        let take: number = 3
        let leverData: any[];


        try {
            do {
                leverData = await LeverDataRepository.find({
                    where: {
                        isSynced: false,
                        hasError: false
                    },
                    take: take,
                    order: {
                        id: "ASC"
                    }
                });

                const leverOppPromise: any[] = leverData.flatMap(async oppData => {

                    const opportunity: any = oppData?.recordData;

                    let postingIds: any[] = []

                    for (const application of opportunity?.applications) {
                        if (data?.postings[application?.posting] === "")
                            data.postings[application?.posting] = []

                        postingIds = [data?.postings[application?.posting]] ?? []
                    }

                    let owner = opportunity?.owner?.email;

                    let userId = await this.getMapping(owner)

                    let stage = data?.stages[opportunity?.stage?.text];
                    let stageId = await this.getMapping(null, stage);

                    let archiveId;
                    if (opportunity?.archived) {
                        archiveId = data?.archiveReasons[opportunity?.archived?.reason]
                    }

                    let performAs = userId ? userId : "307d977b-d9e5-442e-830b-307e38ce78e9"

                    // client owner Id to use for migration - 307d977b-d9e5-442e-830b-307e38ce78e9

                    let mappingData: LeverCandidate = await Lever2leverMappingService.mapOpportunity(opportunity, postingIds, stageId, archiveId, performAs);

                    await this.downloadOppFiles(leverData, dir, oppData.oppLeverId);

                    let resumeUrl = oppData?.resumeUrl ?? "";
                    let otherFileUrl = oppData?.otherFileUrls ?? [];

                    if ((fs.existsSync(resumeUrl))) {
                        resumeUrl = []
                    }

                    if ((fs.existsSync(otherFileUrl))) {
                        otherFileUrl = []
                    }

                    let response = await leverApiService.addOpportunityWithMultipart(performAs, mappingData, resumeUrl[0], otherFileUrl)

                    if (response?.status === 201 && response?.data) {
                        oppData.targetOppLeverId = response.data?.id;
                        oppData.isSynced = true;
                        oppData.migrateDate = new Date();
                        console.log(`Created opportunity ${response?.data?.id} for id: ${opportunity.id} | opp owner - ${performAs}`)
                    } else {
                        oppData.hasError = true;
                        oppData.isSynced = true;
                        oppData.failureLog = `Error: ${response?.error} | Opp Payload - ${JSON.stringify(mappingData)}`;

                        console.log(`opp payload: ${JSON.stringify(mappingData)} for id : ${opportunity.id}`)

                        console.log(`Error while creating target opp for id: ${opportunity.id} | ERROR: ${JSON.stringify(response.data)}`)
                    }

                    await LeverDataRepository.save(oppData);

                    const profileForms = oppData?.profileForms;
                    let oppProfileForms;

                    for (const profileForm of profileForms) {
                        oppProfileForms = profileForm?.fields.map(i => {
                            let body = `Text -> ${i?.text}\n`;
                            body += `Value -> ${i?.value}\n`;

                            return body
                        })
                    }

                    let oppFeedbackForms;
                    const feedBackForms = oppData?.feedbackForms;
                    for (const feedBackForm of feedBackForms) {
                        oppFeedbackForms = feedBackForm?.fields.map(i => {

                            let body = `Feedback\n`;
                            body += `Text  ->  ${i?.text}\n`;
                            body += `Value ->  ${i?.value}\n`;

                            return body
                        });
                    }

                    oppFeedbackForms?.push(...oppProfileForms)

                    const oppNotes = oppData?.notes;
                    let createOppNotes: any = [];

                    for (const oppNote of oppNotes) {
                        createOppNotes = oppNote?.fields?.map(x => {
                            return x?.value
                        })
                    }

                    createOppNotes?.push(...oppFeedbackForms)

                    let noteIDs: any = []
                    if (response?.data?.id) {
                        for (const note of createOppNotes) {
                            let response = await leverApiService.addNote(oppData?.targetOppLeverId, note, true)
                            if (response?.status === 201 && response.data !== null) {
                                noteIDs.push(response?.data?.noteId)
                                console.log(`created notes successfully for opp id: ${oppData.oppLeverId}`)
                            } else {
                                console.error(`Failed to create notes for ${oppData.oppLeverId} Error: ${JSON.stringify(response.data)}`)
                            }
                        }
                        oppData.noteId = noteIDs;
                    }

                    await LeverDataRepository.save(oppData)
                });

                await Promise.all(leverOppPromise);

            } while (leverData.length > 0)
        } catch (e) {
            console.error(e, e.message)
        }
    }

    async downloadOppFiles(processBatch: LeverData[], dir: string, oppId: string): Promise<any> {
        try {
            let resumeFileUrls: any[] = []
            let otherFileUrls: any[] = []
            let resumeFiles
            let offers
            let downloadFiles = [];

            const filesDownloadPromise = processBatch.map(async (opp: LeverData): Promise<any> => {

                let resumes = opp?.resumes?.filter(x => x?.id && x?.file?.name);

                if (resumes)
                    for (const resume of resumes) {
                        resume?.file?.name.length > 15 ? resume?.file?.name.substr(8) : resume?.file?.name

                        resumeFiles = `${dir}/resumes/${resume?.file?.name}`
                        downloadFiles.push(this.downloadResumes(opp.oppLeverId, resume?.id, resumeFiles));
                        opp.resumeUrl = [resumeFiles]
                        resumeFileUrls.push(opp)
                    }


                let otherFiles = opp?.otherFiles?.filter(x => x?.id && x?.name)

                if (otherFiles)
                    for (const otherFile of otherFiles) {
                        otherFile?.name.length > 15 ? otherFile?.name.substr(15) : otherFile?.name

                        otherFiles = `${dir}/otherFiles/${otherFile?.name}`;
                        downloadFiles.push(this.downloadFiles(opp.oppLeverId, otherFile?.id, otherFiles));
                        opp.otherFileUrls = [otherFiles]
                        otherFileUrls.push(opp)
                    }


                let offerData = opp?.offers?.filter(x => x?.id && x?.signedDocument);

                if (offerData)
                    for (const offer of offerData) {
                        offers = `${dir}/offers/${offer?.signedDocument}`;
                        downloadFiles.push(this.downloadOffers(opp.oppLeverId, offer?.id, offers));
                        opp.otherFileUrls = [offers]
                        otherFileUrls.push(opp)
                    }

                const status = await Promise.allSettled(downloadFiles)

                status.forEach(x => {
                    return x.status === "fulfilled"
                })
            });

            await Promise.all(filesDownloadPromise)
            await LeverDataRepository.save(resumeFileUrls);
            await LeverDataRepository.save(otherFileUrls);

            console.log(`Downloaded files - resumes: ${resumeFileUrls.length} otherFiles: ${otherFileUrls.length} for opportunity: ${oppId}`)

            resumeFileUrls = [];
            otherFileUrls = [];

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
                fs.rmdirSync(dir, {recursive: true});
            }

            fs.mkdirSync(dir, {recursive: true});
        });
    }

    async downloadResumes(oppId: string, resumeId: string, dir: string): Promise<any> {
        const leverApiService = new LeverApiService("", true, false);

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
            console.log(response.data?.statusMessage, response?.data?.statusCode);
        }
    }

    async downloadOffers(oppId: string, offerId: string, dir: string): Promise<any> {
        const leverApiService = new LeverApiService("", true, false);

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
            console.log(offerResponse.data?.statusMessage, offerResponse?.data?.statusCode);
        }
    }

    async downloadFiles(oppId: string, otherFilesId: string, dir: string): Promise<any> {
        const leverApiService = new LeverApiService("", true, false);

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
            console.log(fileRes.data?.statusMessage, fileRes?.data?.statusCode);
        }
    }

    async parseCsv(): Promise<any> {
        let csvPath: string[] = [`./mapping/postings.csv`, `./mapping/archive_reasons.csv`, `./mapping/stages.csv`];

        let data = await Promise.all(csvPath.map(async csv1 => {
            let readCsv = fs.readFileSync(csv1);

            const csvContent = readCsv.toString("utf-8");

            let csvData = [];

            await csv()
                .fromString(csvContent)
                .subscribe((data) => {
                    csvData.push(data);
                });


            let testObj: any = {};

            if (csv1.endsWith("archive_reasons.csv")) {
                for (const x of csvData) {
                    testObj[x['SourceArchiveId']] = x['TargetArchiveId']
                }
            }

            for (const x of csvData) {
                testObj[x['SourceId']] = x['TargetId']
            }

            return testObj
        }));


        return {
            postings: data[0],
            archiveReasons: data[1],
            stages: data[2]
        }
    }


    async getMapping(user?: string, stage?: string): Promise<any> {
        const leverApi = new LeverApiService(config.get("lever.targetKey"), false, true)

        if (!user && !stage)
            return

        let resData = user ? await leverApi.getUser(user) : await leverApi.getStages()

        let responseValue;
        if (resData?.status === 200 && resData?.data) {
            resData?.data.map(data => {
                if (data?.email === user) {
                    responseValue = data.id
                } else if (data?.text === stage) {
                    responseValue = data.id
                }
            })
            return responseValue
        } else {
            console.error(`Unable to fetch data ${JSON.stringify(resData?.data?.message)}`)
        }
    }
}