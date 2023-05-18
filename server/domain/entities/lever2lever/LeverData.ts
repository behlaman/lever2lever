import {Column, Entity, Index} from "typeorm";
import {BaseEntity} from "../../../BaseEntity";
import {LeverCandidate} from "../lever/LeverCandidate";
import {Offer} from "../lever/Offer";

@Entity("lever_import_data")
export class LeverData extends BaseEntity {

    constructor() {
        super();
    }

    @Column({nullable: true})
    @Index()
    oppLeverId: string;

    @Column({nullable: true})
    @Index()
    targetOppLeverId: string;

    @Column("json", {nullable: true})
    oppOwner: any;

    @Column("json", {nullable: true})
    recordData: LeverCandidate;

    @Column("json", {nullable: true})
    offers: Offer[];

    @Column("json", {nullable: true})
    resumes: any;

    @Column("json", {nullable: true})
    notes: any;

    @Column({type: "varchar", array: true, nullable: true})
    resumeUrl: any[];

    @Column({type: "varchar", array: true, nullable: true})
    otherFileUrls: any[];

    @Column({type: "varchar", array: true, nullable: true})
    excludedFileUrls: any[];

    @Column("json", {nullable: true})
    otherFiles: any;

    @Column("json", {nullable: true})
    feedbackForms: any;

    @Column("json", {nullable: true})
    profileForms: any;

    @Column({type: "varchar", array: true, nullable: true})
    noteId: string[];

    @Column("json", {nullable: true})
    failureLog: any;

    @Column({default: false})
    @Index()
    isSynced: boolean;

    @Column({default: false})
    @Index()
    hasError: boolean;

    @Column({type: Date, nullable: true})
    importDate: Date;

    @Column({type: Date, nullable: true})
    migrateDate: Date;
}
