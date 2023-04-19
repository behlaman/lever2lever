import {Column, CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

export interface IEntity {
    id: number;
}

export interface ITrackable {
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export abstract class BaseEntity implements IEntity, ITrackable {

    toJson() {
        let jsonData = Object.assign({}, this);
        delete jsonData.id;
        delete jsonData.deletedAt;
        return jsonData;
    }

    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
