import * as fs from "fs";

const csv = require("csvtojson");

export class ImportCsv {

    async importMappingCsv(): Promise<any> {

        let filePath = `./mapping/Lever_Postings.csv`;
        let readCsv = fs.readFileSync(filePath);

        const csvContent = readCsv.toString("utf-8");
        let csvData = [];

        await csv()
            .fromString(csvContent)
            .subscribe((data) => {
                csvData.push(data);
            });

        // console.log(csvData)

        let testObj: any = {};
        csvData.map(x => testObj[x['Source Posting ID']] = x['Target Posting ID'])



        console.log(testObj["310f8ee2-dc2f-497b-b7bf-be9d89967b02"])
        csvData.push(csvContent.split("\r\n").map(line => {
            return line.split(",")
        }));

        // let sourceIds = [];
        // let targetIds = [];
        //
        // csvData.flatMap(x => {
        //     console.log(x)
        //     // x.map(y => {
        //     //     console.log(y)
        //     //     sourceIds.push(y)
        //     // })
        //     //
        //     for (let i = 1; i < x.length; i++) {
        //         sourceIds.push(x[i])
        //     }
        //
        // });
        //
        //
        // console.log(sourceIds)
    }
}