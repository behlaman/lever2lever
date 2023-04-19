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

    console.log(csvData);

    for(let i=0;i<csvData.length;i++) {
      let postingIds = csvData.filter(x => x[i].);

    }

    console.log(postingIds);

  }
}