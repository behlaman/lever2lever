import {suite, test, timeout} from "mocha-typescript";
import {BaseTest} from "./BaseTest";
import {LeverSyncJob} from "../server/jobs/leverSyncJob";
import {LeverApiService} from "../services/leverApiService";
import * as config from "config";
import {LeverDataRepository} from "../server/db/lever/LeverDataRepository";
import {LeverMigrateJob} from "../server/jobs/leverMigrateJob";
import {IsNull, Not} from "typeorm";
import {id} from "inversify";
import * as csvWriter from "csv-writer";

@suite("Lever Sync Job", timeout(800000000000000000000))
export class LeverSyncJobSpec extends BaseTest {

    async before() {
        await this.prepareDb();
    }

    @test("Fetch Opp From Lever")
    async testSyncJob() {
        // await LeverDataRepository.delete({});

        const leverApi = new LeverApiService(config.get("lever.sourceKey"), true, false);
        let syncJob = new LeverSyncJob();
        await syncJob.syncLeverOpp();

        // await syncJob.getPostings();
    }

    @test("get data From Lever")
    async testApi() {
        const leverApi = new LeverApiService(config.get("lever.sourceKey"), true, true);
        let res = await leverApi.downloadResumes("2c9477f0-78ca-49b8-b7d5-d893bd9f8a6b", "a4a28512-6656-43cd-a5b5-704eaf307bae");
        console.log(res);
    }

    @test("get files From Lever")
    async getFiles() {
        let oppData = await LeverDataRepository.find({});
        let arr: string[] = [];
        let url = [];


        const resumes = oppData.flatMap(x => x.recordData);

        console.log(resumes);
    }

    @test("download data From Lever")
    async testDownloadFile() {

        const leverApi = new LeverApiService(config.get("lever.sourceKey"), true, true);
        const job = new LeverMigrateJob();

        // await job.getUserMapping(100, "")
    }

    @test("readCsv")
    async readCsv() {
        const leverApi = new LeverApiService("", true, false);

        let res = await leverApi.getPostings();
        let rec = res.data.map(x => x.id);

        console.log(rec)
    }


    @test("test migrate job")
    async migrateToLever() {

        const job = new LeverMigrateJob()
        await job.migrateOpportunities();
    }

    @test("Get Corresponding opp Ids from target")
    async getIDs() {

        let data = await LeverDataRepository.find({
            where: {
                isSynced: true,
                hasError: false
            },
            order: {id: "ASC"}
        })

        let oppObj = {};

        data.flatMap(oppData => {
            oppObj[oppData['oppLeverId']] = oppData['targetOppLeverId'];
        })

        // console.log(oppObj);

        let fileName = `./temp/oppFiles_${new Date().valueOf()}.csv`;
        const writer = csvWriter.createObjectCsvWriter({
            path: fileName,
            header: [
                {id: "oppLeverId", title: "Source Opp ID"},
                {id: "targetOppLeverId", title: "Target Opp ID"},
            ]
        });

        await writer.writeRecords(data);

        console.log(oppObj);

    }


    @test("get archive reasons")
    async getAR() {
        const leverApi = new LeverApiService("", false, true);

        let data: { id: string, text: string } = {
            id: "",
            text: ""
        }
        let arData = await leverApi.getArchiveReasons();
        if (arData?.status === 200 && arData?.data?.length > 0) {
            arData?.data?.map(x => {
                data[x['id']] = x['text']
            })
            console.log(data)
            return data;
        }
    }


    @test("get postings count")
    async getPostingsCount() {

        let dataRec = await LeverDataRepository.find({});

        const opps: any = dataRec.flatMap(x => x.recordData);

        let postings = [];

        let dara = opps.filter(opp => opp.applications.length === 0)

        console.log(dara);
        console.log(postings);
    }

    @test("get parsed csv data")
    async parseCSV() {
        const job = new LeverMigrateJob()
        await job.parseCsv()
    }


    @test("regex test")
    async parseString() {
        let string = "Mariko/Interviewers.eml"

        let a = string?.includes("/") ? string.replace("/", "_") : string
        console.log(a)
    }

    @test("getFailedPostings csv")
    async getPostingsCsv() {

        let failedRecords = await LeverDataRepository.find({
            where: {
                isSynced: true,
                hasError: true
            }
        })

        let data = {}

        failedRecords.flatMap(x => {
            data[x['oppLeverId']] = x['failureLog']
        })

        let fileName = `./temp/invalid_Postings_${new Date().valueOf()}.csv`;
        const writer = csvWriter.createObjectCsvWriter({
            path: fileName,
            header: [
                {id: "oppLeverId", title: "Source Opp ID"},
                {id: "failureLog", title: "Failure Log"},
            ]
        });

        await writer.writeRecords(failedRecords);


    }

    @test("update_db")
    async updateDataRecords() {
        await LeverDataRepository.update({isSynced: true}, {
            isSynced: false,
            targetOppLeverId: null,
            hasError: false,
            migrateDate: null,
            failureLog: null
        })
    }


    @test("generate oppFiles csv")
    async generateCsv() {
        let oppsData = await LeverDataRepository.find({
            where: {
                targetOppLeverId: Not(IsNull()),
                isSynced: true,
                hasError: false
            },
        })

        const files = oppsData.filter(x => x?.excludedFileUrls?.length > 0)
        let data = []

        files.flatMap(x => x.excludedFileUrls.map(y => {

            const split = y.split("otherFiles/")[1]
            const name = split.split("/")[1];
            const id = split.split("/")[0]

            const files = x.otherFiles

            for (const file of files) {
                data.push({
                    FileName: name,
                    OppId: id,
                    fileSize: file?.size,
                    fileId: file?.id
                })
            }
        }));

        await Promise.all([files]);

        let fileName = `./temp/oppFiles_${new Date().valueOf()}.csv`;
        const writer = csvWriter.createObjectCsvWriter({
            path: fileName,
            header: [
                {id: "FileName", title: "File Name"},
                {id: "OppId", title: "Opp Id"},
                {id: "fileSize", title: "File Size"},
                {id: "fileId", title: "File Id"},

            ]
        });

        await writer.writeRecords(data);
    }

    @test("Get opp emails")
    async getEmails(): Promise<any> {
        let dataRec = await LeverDataRepository.find({});

        let oppEmails = []

        dataRec.flatMap(x => {
            let opp = x.recordData
            oppEmails.push({
                emails: opp?.emails,
                oppId: opp?.id
            });
        })

        console.log(oppEmails);

        let fileName = `./temp/oppEmails_${new Date().valueOf()}.csv`;
        const writer = csvWriter.createObjectCsvWriter({
            path: fileName,
            header: [
                {id: "emails", title: "Opp Emails"},
                {id: "oppId", title: "Opp Id"},
            ]
        });

        await writer.writeRecords(oppEmails);
    }
}

