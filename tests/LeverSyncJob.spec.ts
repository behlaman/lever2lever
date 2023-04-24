import {suite, test, timeout} from "mocha-typescript";
import {BaseTest} from "./BaseTest";
import {LeverSyncJob} from "../server/jobs/leverSyncJob";
import {LeverApiService} from "../services/leverApiService";
import * as config from "config";
import {LeverDataRepository} from "../server/db/lever/LeverDataRepository";
import {LeverMigrateJob} from "../server/jobs/leverMigrateJob";

@suite("Lever Sync Job", timeout(800000000000000000000))
export class LeverSyncJobSpec extends BaseTest {

    async before() {
        await this.prepareDb();
    }

    @test("Fetch Opp From Lever")
    async testSyncJob() {
        await LeverDataRepository.delete({});

        const leverApi = new LeverApiService(config.get("lever.sourceKey"), true);
        let syncJob = new LeverSyncJob();
        await syncJob.syncLeverOpp();

    }

    @test("get data From Lever")
    async testApi() {
        const leverApi = new LeverApiService(config.get("lever.sourceKey"), true);
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

        const leverApi = new LeverApiService(config.get("lever.sourceKey"), true);
        const job = new LeverMigrateJob();

        // await job.downloadOppFiles()
    }

    @test("readCsv")
    async readCsv() {

        const readCsv = new LeverMigrateJob().parseCsv();
    }


    @test("test migrate job")
    async migrateToLever() {

        const job = new LeverMigrateJob()
        await job.migrateOpportunities();
    }


}

