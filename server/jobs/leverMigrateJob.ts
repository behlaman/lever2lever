import {LeverApiService} from "../../services/leverApiService";
import * as config from "config";
import {LeverDataRepository} from "../db/lever/LeverDataRepository";
import {Lever2leverMappingService} from "../../services/lever2leverMappingService";
import * as fs from "fs";
import {LeverData} from "../domain/entities/lever2lever/LeverData";
import csv = require("csvtojson/index");

export class LeverMigrateJob {
    async migrateOpportunities(): Promise<any> {
        let dir = `./temp/leverOppFiles`;
        await this.createDir(dir);

        let data = await this.parseCsv()

        const leverApiService = new LeverApiService(config.get("lever.targetKey"), false);
        let take: number = 1;
        let skipCount = 0
        let leverData;

        try {
            do {
                leverData = await LeverDataRepository.find({
                    where: {
                        isSynced: false,
                        hasError: false
                    },
                    skip: skipCount,
                    take: take,
                    order: {
                        id: "ASC"
                    }
                });

                const leverOppPromise: any[] = leverData.flatMap(async oppData => {

                    const opportunity: any = oppData.recordData;

                    let postingIds: any[] = []

                    for (const application of opportunity?.applications) {
                        postingIds = data?.postings[application?.posting] ?? []
                    }


                    let owner = opportunity?.owner?.email;
                    let ownerId;
                    let userRes = await leverApiService.getUsers();
                    if (userRes?.status === 200 && userRes?.data) {
                        userRes?.data.map(user => {
                            if (user?.email === owner) {
                                ownerId = user?.id;
                            }
                        })
                    }

                    let stage;
                    let res = await leverApiService.getStages();
                    if (res?.status === 200 && res?.data) {
                        res?.data.map(x => {
                            if (x.text === data?.stages[opportunity?.stage?.text]) {
                                return stage = x.id;
                            }
                        })
                    } else {
                        console.error(`Unable to fetch stages ${res?.data}`)
                    }

                    let archiveReason;
                    let archiveRes = await leverApiService.getArchiveReasons();
                    if (archiveRes?.status === 200 && archiveRes?.data) {
                        archiveRes?.data.map(x => {
                            if (x.text === data?.archiveReasons[opportunity?.archived?.reason]) {
                                archiveReason = opportunity?.archived === null ? null : data?.archiveReasons[opportunity?.archived?.reason]
                            }
                        })
                    } else {
                        console.error(`Unable to fetch archiveReasons ${archiveRes?.data}`)
                    }

                    let performAs = ownerId ? ownerId : "6ce93850-a74a-4008-bcf7-486bfe44f63f"

                    let mappingData = await Lever2leverMappingService.mapOpportunity(opportunity, postingIds, stage, archiveReason, performAs);

                    await this.downloadOppFiles(leverData, dir, oppData.oppLeverId);

                    let resumeUrl = oppData?.resumeUrl ?? "";
                    let otherFileUrl = oppData?.otherFileUrls ?? [];

                    let response = await leverApiService.addOpportunityWithMultipart(performAs, mappingData, resumeUrl[0], otherFileUrl)

                    if (response?.status === 201 && response?.data) {
                        oppData.targetOppLeverId = response.data?.id;
                        oppData.isSynced = true;
                        oppData.migrateDate = new Date();
                        console.log(`Created opportunity ${response?.data?.id} for id: ${opportunity.id}`)
                    } else {
                        oppData.hasError = true;
                        oppData.isSynced = true;
                        oppData.failureLog = response?.data?.message;

                        console.log(`opp payload: ${mappingData} for id : ${opportunity.id}`)
                        console.log(`Error while creating target opp for id: ${opportunity.id}
                     ERROR: ${JSON.stringify(response.data)}`)
                    }

                    await LeverDataRepository.save(oppData);

                    const profileForms = oppData?.profileForms;
                    let oppProfileForms;

                    for (const profileForm of profileForms) {
                        oppProfileForms = profileForm?.fields.map(i => {
                            let body = `Profile Form\n`
                            body += `Text - ${i?.text}\n`
                            body += `Value - ${i?.value}\n`
                            body += `Description - ${i?.description}\n`

                            return body
                        })
                    }

                    let oppFeedbackForms;
                    const feedBackForms = oppData?.feedbackForms;
                    for (const feedBackForm of feedBackForms) {
                        oppFeedbackForms = feedBackForm?.fields.map(i => {
                            let body = `Profile Form\n`
                            body += `Text - ${i?.text}\n`
                            body += `Value - ${i?.value}\n`
                            body += `Description - ${i?.description}\n`

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

                    for (const note of createOppNotes) {
                        let response = await leverApiService.addNote(oppData.oppLeverId, note, true)
                        if (response?.status === 201 && response.data !== null) {
                            oppData.noteId = response?.data?.noteId;
                            console.log(`created notes successfully for opp id: ${oppData.oppLeverId}`)
                        } else {
                            console.error(`Failed to create notes for ${oppData.oppLeverId} Error: ${response.data} | ${response.error}`)
                        }
                    }
                    await LeverDataRepository.save(oppData)
                });

                await Promise.all(leverOppPromise);

                skipCount += 1

            } while (leverData.length === 1)
        } catch (e) {
            console.error(e, e.message)
        }
    }

    async downloadOppFiles(processBatch: LeverData[], dir: string, oppId: string): Promise<any> {
        try {
            let resumeFileUrls: any[] = []
            let otherFileUrls: any[] = []
            let resumeFiles
            let otherFiles
            let offers
            let downloadFiles = [];

            const filesDownloadPromise = processBatch.map(async (opp: LeverData): Promise<any> => {

                let resumeIds = opp.resumes.map(x => x.id);
                let resumeFileName = opp.resumes?.map(x => x?.file?.name);

                if (resumeFileName) {
                    if (resumeIds.length > 0) {
                        for (const resumeId of resumeIds) {
                            resumeFiles = `${dir}/resumes/${resumeFileName}`
                            downloadFiles.push(this.downloadResumes(opp.oppLeverId, resumeId, resumeFiles));
                            opp.resumeUrl = [resumeFiles]
                            resumeFileUrls.push(opp)
                        }
                    }
                }

                let offerIds = opp?.offers.map(x => x.id);
                let offerFile = opp.offers?.map(x => x.signedDocument);

                if (offerFile) {
                    if (offerIds.length > 0) {
                        for (const offerId of offerIds) {
                            offers = `${dir}/offers/${offerFile}`;
                            downloadFiles.push(this.downloadOffers(opp.oppLeverId, offerId, offers));
                            opp.otherFileUrls = [offers]
                            otherFileUrls.push(opp)
                        }
                    }
                }

                let otherOppFileIds = opp?.otherFiles?.map(x => x.id);
                let otherFileName = opp.otherFiles?.map(x => x.name);

                if (otherFileName) {
                    if (otherOppFileIds.length > 0) {
                        for (const otherOppFileId of otherOppFileIds) {
                            otherFiles = `${dir}/otherFiles/${otherFileName}`;
                            downloadFiles.push(this.downloadFiles(opp.oppLeverId, otherOppFileId, otherFiles));
                            opp.otherFileUrls = [otherFiles]
                            otherFileUrls.push(opp)
                        }
                    }
                }

                await Promise.all(downloadFiles)
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
        const leverApiService = new LeverApiService(config.get("lever.sourceKey"), true);

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

    async downloadOffers(oppId: string, offerId: string, dir: string): Promise<any> {
        const leverApiService = new LeverApiService(config.get("lever.sourceKey"), true);

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

    async downloadFiles(oppId: string, otherFilesId: string, dir: string): Promise<any> {
        const leverApiService = new LeverApiService(config.get("lever.sourceKey"), true);

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

    async parseCsv(): Promise<any> {
        let csvPath: string[] = [`./mapping/Lever_Postings.csv`, `./mapping/Lever_archiveReasons.csv`, `./mapping/Lever_Stages.csv`];

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
}