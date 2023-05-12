import {LeverApiService} from "../../services/leverApiService";
import * as config from "config";
import {LeverDataRepository} from "../db/lever/LeverDataRepository";
import {Lever2leverMappingService} from "../../services/lever2leverMappingService";
import * as fs from "fs";
import {LeverData} from "../domain/entities/lever2lever/LeverData";
import csv = require("csvtojson/index");
import {LeverCandidate} from "../domain/entities/lever/LeverCandidate";
import {chunk} from "lodash";

export class LeverMigrateJob {
    async migrateOpportunities(): Promise<any> {
        let dir = `./temp/leverOppFiles`;
        await this.createDir(dir);

        let data = await this.parseCsv()

        const leverApiService = new LeverApiService("", false, true);
        let take: number = 1
        let leverData: any[];


        try {
            do {
                leverData = await LeverDataRepository.find({
                    where: {
                        oppLeverId: 'f7bfe8ee-19b2-4a9f-b1df-7029e641f5c1'
                        // isSynced: false,
                        // hasError: false
                    },
                    take: take,
                    order: {
                        id: "ASC"
                    }
                });

                const leverOppPromise = leverData.flatMap(async oppData => {
                    const opportunity: any = oppData?.recordData;

                    console.log(`Processing opportunity : ${opportunity?.id}`)

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

                    let downloadUrls = await this.downloadOppFiles(oppData, dir);

                    oppData.resumeUrl = downloadUrls?.resumeUrl
                    oppData.otherFileUrls = downloadUrls?.otherFileUrls;
                    oppData.excludedFileUrls = downloadUrls?.excludedFileUrls

                    let resumeUrl = downloadUrls?.resumeUrl ?? "";

                    if ((fs.existsSync(resumeUrl))) {
                        resumeUrl = []
                    }

                    // let response = await leverApiService.addOpportunityWithMultipart(performAs, mappingData, resumeUrl[0])
                    //
                    // if (response?.status === 201 && response?.data) {
                    //     oppData.targetOppLeverId = response.data?.id;
                    //     oppData.isSynced = true;
                    //     oppData.migrateDate = new Date();
                    //     console.log(`Created opportunity ${response?.data?.id} for id: ${opportunity.id} | opp owner - ${performAs}`)
                    // } else {
                    //     oppData.hasError = true;
                    //     oppData.isSynced = true;
                    //     oppData.failureLog = `Error Payload: ${JSON.stringify(response)} | Opp Payload - ${JSON.stringify(mappingData)}`;
                    //
                    //     console.log(`Error while creating target opp for id: ${opportunity.id} | ERROR: ${JSON.stringify(response.data)}`)
                    // }

                    await LeverDataRepository.save(oppData);

                    const profileForms = oppData?.profileForms;
                    let oppProfileForms: any = [];

                    for (const profileForm of profileForms) {
                        oppProfileForms = profileForm?.fields?.map(i => {
                            let body = `Profile Form\n`;
                            body += `Text  ->  ${i?.text}\n`;
                            body += `Value ->  ${JSON.stringify(i?.value)}`;

                            return body
                        })
                    }

                    let oppFeedbackForms: any = [];
                    const feedBackForms = oppData?.feedbackForms;
                    for (const feedBackForm of feedBackForms) {
                        oppFeedbackForms = feedBackForm?.fields.map(i => {

                            let body = `Feedback\n`;
                            body += `Text  ->  ${i?.text}\n`;
                            body += `Value ->  ${JSON.stringify(i?.value)}`;

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
                    // if (response?.data?.id) {
                        for (const note of createOppNotes) {
                            let response = await leverApiService.addNote(oppData?.targetOppLeverId, note, true)
                            if (response?.status === 201 && response.data !== null) {
                                noteIDs.push(response?.data?.noteId)
                                console.log(`created notes successfully for opp id: ${oppData?.targetOppLeverId}`)
                            } else {
                                console.error(`Failed to create notes for ${oppData?.targetOppLeverId} Error: ${JSON.stringify(response?.data)}`)
                            }
                        }
                        oppData.noteId = noteIDs;
                    // }

                    await this.uploadOppFiles(oppData?.targetOppLeverId, oppData?.otherFileUrls, performAs)

                    await LeverDataRepository.save(oppData)
                })

                await Promise.all(leverOppPromise);

            } while (leverData.length > 0)
        } catch (e) {
            console.error(e, e.message)
        }
    }

    async downloadOppFiles(opp: LeverData, dir: string): Promise<any> {
        try {
            let resumeFileUrls: any[] = []
            let otherFileUrls: any[] = []
            let largeFileUrls: any[] = []
            let resumeFiles
            let offers
            let downloadFiles = [];

            let oppFile

            let resumes = opp?.resumes?.filter(x => x?.id && x?.file?.name);

            if (resumes)
                for (const resume of resumes) {
                    resume?.file?.name.length > 15 ? resume?.file?.name.substr(8) : resume?.file?.name

                    resumeFiles = `${dir}/resumes/${resume?.file?.name}`
                    downloadFiles.push(this.downloadResumes(opp.oppLeverId, resume?.id, resumeFiles));
                    resumeFileUrls.push(resumeFiles)
                }


            let otherFiles = opp?.otherFiles?.filter(x => x?.id && x?.name)

            let baseFileDir = `${dir}/otherFiles`
            let largeFileDir

            if (otherFiles)
                for (const otherFile of otherFiles) {
                    let fileName = otherFile?.name.includes("\u001b") ? (otherFile?.name).replace(/[^a-zA-Z0-9.]+/g, "_") : otherFile?.name

                    fileName?.length > 15 ? fileName.substr(15) : fileName
                    oppFile = `${baseFileDir}/${fileName}`;

                    if (otherFile?.size > 31000000) {
                        // as the limit is 30 mb , we are only saving files below 30mb to DB, but downloading the same to local

                        largeFileDir = `${baseFileDir}/${opp?.oppLeverId}`
                        if (!fs.existsSync(largeFileDir))
                            fs.mkdirSync(largeFileDir, {recursive: true});

                        oppFile = `${largeFileDir}/${otherFile?.name}`
                        largeFileUrls.push(oppFile)
                    } else otherFileUrls.push(oppFile)

                    downloadFiles.push(this.downloadFiles(opp.oppLeverId, otherFile?.id, oppFile));
                }


            let offerData = opp?.offers?.filter(x => x?.id && x?.signedDocument);

            if (offerData)
                for (const offer of offerData) {
                    offers = `${dir}/offers/${offer?.signedDocument}`;
                    downloadFiles.push(this.downloadOffers(opp.oppLeverId, offer?.id, offers));
                    otherFileUrls.push(offers);
                }

            const status = await Promise.allSettled(downloadFiles)

            status.forEach(x => {
                return x.status === "fulfilled"
            })

            console.log(`Downloaded files - resumes: ${resumeFileUrls?.length} otherFiles: ${otherFileUrls?.length} largeFile: ${largeFileUrls?.length} for opportunity: ${opp.oppLeverId}`)

            return {
                resumeUrl: resumeFileUrls,
                otherFileUrls: otherFileUrls,
                excludedFileUrls: largeFileUrls
            }

        } catch (e) {
            console.error(e, e.message);
        }
    }


    async uploadOppFiles(oppId: string, files: string[], performAs: string): Promise<any> {

        const leverApiService = new LeverApiService("", false, true);

        if (!files)
            console.log(`No files available for opp id: ${oppId}`);

        const fileBatch = chunk(files, 5)

        let downloadedFiles = []

        if (oppId) {
            for (const fileArr of fileBatch) {
                await Promise.all(fileArr.map(async file => {
                    let response = await leverApiService.uploadOppFiles(oppId, file, performAs);
                    if (response?.status === 200 && response?.data) {
                        downloadedFiles.push(response?.data?.id);
                        // console.log(`Successfully uploaded file for oppId: ${oppId}`)
                    } else {
                        console.log(`Error while uploading files ${JSON.stringify(response?.data)}`)
                    }
                }))
                console.log(`uploaded  ${downloadedFiles?.length} files for opp: ${oppId}`)
            }
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

        // console.log('entered func')
        let fileRes = await leverApiService.downloadFiles(oppId, otherFilesId);

        // console.log('response')
        if (fileRes?.status === 200 && fileRes?.data) {
            let writeStream = fs.createWriteStream(dir);
            fileRes?.data.pipe(writeStream);

            await new Promise((resolve) => {
                writeStream.on("finish", () => {
                    writeStream.end();
                    resolve(true);
                });
            })
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