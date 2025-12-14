export interface DataCubeClientConfig {
    apiKey: string;
}
export declare class DataCubeClient {
    private apiUrl;
    private apiKey;
    constructor(config: DataCubeClientConfig);
    private request;
    getStatus(): Promise<any>;
    getUsage(): Promise<any>;
    me(): Promise<any>;
    execute(body: any): Promise<any>;
    executionStatus(id: string): Promise<any>;
    help(): Promise<string>;
}
