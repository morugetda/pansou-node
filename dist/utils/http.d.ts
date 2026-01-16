import { AxiosRequestConfig } from 'axios';
export declare class HttpClient {
    private client;
    constructor();
    get(url: string, options?: AxiosRequestConfig): Promise<any>;
    post(url: string, data?: any, options?: AxiosRequestConfig): Promise<any>;
    request(options: AxiosRequestConfig): Promise<any>;
}
export declare function getHttpClient(): HttpClient;
//# sourceMappingURL=http.d.ts.map