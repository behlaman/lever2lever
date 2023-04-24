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

    @Column("jsonb", {nullable: true})
    oppOwner: any;

    @Column("jsonb", {nullable: true})
    recordData: LeverCandidate[];

    @Column("jsonb", {nullable: true})
    offers: Offer[];

    @Column("jsonb", {nullable: true})
    resumes: any;

    @Column("jsonb", {nullable: true})
    notes: any;

    @Column({type: "varchar", array: true, nullable: true})
    resumeUrl: any[];

    @Column({type: "varchar", array: true, nullable: true})
    otherFileUrls: any[];

    @Column("jsonb", {nullable: true})
    otherFiles: any;

    @Column("jsonb", {nullable: true})
    feedbackForms: any;

    @Column("jsonb", {nullable: true})
    profileForms: any;

    @Column({type: "varchar", array: true, nullable: true})
    noteId: string[];

    @Column("jsonb", {nullable: true})
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
