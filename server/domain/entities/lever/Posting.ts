export interface  Posting {
    id: string;
    text?: string;
    state: string;
    distributionChannels?: string[];
    user: string;
    owner: string;
    hiringManager?: any;
    categories: Categories;
    tags?: (string)[] | null;
    content: Content;
    followers?: (string)[] | null;
    reqCode: string;
    urls: Urls;
    createdAt?: number;
    updatedAt?: number;
}

export interface Categories {
    commitment: string;
    department?: string;
    level?: null;
    location: string;
    team: string;
}

export interface Content {
    description: string;
    descriptionHtml: string;
    lists?: (null)[] | null;
    closing: string;
    closingHtml: string;
    customQuestions?: (null)[] | null;
}

export interface Urls {
    list: string;
    show: string;
    apply: string;
}
