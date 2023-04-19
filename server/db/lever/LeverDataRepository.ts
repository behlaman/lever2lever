import appDataSource from "../DataSource";
import { LeverData } from "../../domain/entities/lever2lever/LeverData";

export const LeverDataRepository = appDataSource.getRepository(LeverData).extend({});

