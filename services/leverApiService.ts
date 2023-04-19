import { AxiosInstance, AxiosResponse, default as Axios } from "axios";
import * as config from "config";

declare type ApiResponse = {
  status: number;
  data: any;
  error?: any;
};

export class LeverApiService {
  private axios: AxiosInstance;
  private leverApiKey: string;

  constructor(leverApiKey: string) {
    this.leverApiKey = leverApiKey;
    let headers = {};

    this.axios = Axios.create({
      baseURL: config.get("lever.baseUrl"),
      auth: {
        username: config.get("lever.sourceKey"),
        password: ""
      },
      headers: headers
    });
  }

  async listAllOpp(limit?: Number, offset?: string, createdAtStart?: Date): Promise<any> {
    let requestParams: any = {
      limit: limit,
      created_at_start: createdAtStart.valueOf()
    };

    if (offset)
      requestParams.offset = offset;

    let allParams = ["expand=applications", "expand=stage", "expand=owner", "expand=followers", "expand=sourcedBy", "expand=contact"];

    return await this.axios.get(`/opportunities?${allParams.join("&")}`, { params: requestParams })
      .catch(e => e.response);
  }

  async getProfileForm(oppId: string): Promise<{ status: number, data: any }> {
    let res = await this.axios.get(`/opportunities/${oppId}/forms`).catch(e => e.response);
    return this.parseResponse(res);
  }

  async getFiles(oppId: string): Promise<{ status: number, data: any }> {
    let res = await this.axios.get(`/opportunities/${oppId}/files`).catch(e => e.response);
    return this.parseResponse(res);
  }

  async getResumes(oppId: string): Promise<{ status: number, data: any }> {
    let res = await this.axios.get(`/opportunities/${oppId}/resumes`).catch(e => e.response);
    return this.parseResponse(res);
  }

  async getNotes(oppId: string): Promise<{ status: number, data: any }> {
    let response = await this.axios.get(`/opportunities/${oppId}/notes`).catch(e => e.response);
    return this.parseResponse(response);
  }

  async downloadResumes(oppId: string, resumeId: string, status?: string): Promise<{ status: number, data: any }> {
    let response = await this.axios.get(`/opportunities/${oppId}/resumes/${resumeId}/download`, { responseType: "stream" }).catch(e => e.response);
    return this.parseResponse(response);
  }

  async downloadOfferFile(oppId: string, offerId: string): Promise<{ status: number, data: any }> {
    let res = await this.axios.get(`/opportunities/${oppId}/offers/${offerId}/download`, { responseType: "stream" }).catch(e => e.response);
    return this.parseResponse(res);
  }

  async downloadFiles(oppId: string, fileId: string): Promise<{ status: number, data: any }> {
    let res = await this.axios.get(`/opportunities/${oppId}/files/${fileId}/download`, { responseType: "stream" }).catch(e => e.response);
    return this.parseResponse(res);
  }

  async getOffers(oppId: string): Promise<{ status: number, data: any }> {
    let response = await this.axios.get(`/opportunities/${oppId}/offers`).catch(e => e.response);
    return this.parseResponse(response);
  }

  async getFeedbackForm(oppId: string): Promise<{ status: number, data: any }> {
    let res = await this.axios.get(`/opportunities/${oppId}/feedback`).catch(e => e.response);
    return this.parseResponse(res);
  }

  async getArchiveReasons(type?: string): Promise<{ status: number, data: any }> {
    let params = {
      type: type
    };
    let res = await this.axios.get(`/archive_reasons`, { params }).catch(e => e.response);
    return this.parseResponse(res);
  }

  async getStages(): Promise<{ status: number, data: any }> {
    let res = await this.axios.get(`/stages`).catch(e => e.response);
    return this.parseResponse(res);
  }

  async getSources(): Promise<{ status: number, data: any }> {
    let res = await this.axios.get(`/sources`).catch(e => e.response);
    return this.parseResponse(res);
  }

  async getUsers(): Promise<{ status: number, data: any }> {
    let res = await this.axios.get(`/users`).catch(e => e.response);
    return this.parseResponse(res);
  }

  async sleep(ms: number = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  parseResponse(response: any): ApiResponse {
    let data;
    if (response) {
      if (response.data) {
        if (response.data.data) {
          data = response.data.data;
        } else {
          data = response.data;
        }
      } else {
        data = response;
      }
    } else {
      data = -1;
    }
    return {
      status: response ? response.status : -1,
      data: data
    };
  }
}

