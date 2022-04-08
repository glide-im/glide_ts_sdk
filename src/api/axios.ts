import axios, { AxiosInstance, AxiosPromise } from "axios";
import { Response } from "./response";

export const axiosInstance: AxiosInstance = axios.create({
    timeout: 3000,
    baseURL: process.env.REACT_APP_BASE_URL,
});

const setAuthHeader = (key: string, value: string) => {
    axiosInstance.defaults.headers.common[key] = value;
};

export function setBaseUrl(url: string) {
    axiosInstance.defaults.baseURL = url;
}

export function getBaseUrl(): string {
    return axiosInstance.defaults.baseURL;
}

export function setApiToken(token: string) {
    setAuthHeader("Authorization", "Bearer " + token);
}

export function get<T>(path: string): Promise<T> {
    const req = get_(path);
    return resolve(req)
}

export function post<T>(path: string, data?: any): Promise<T> {
    const req = post_(path, data);
    return resolve(req)
}

function resolve<T>(axiosPromise: AxiosPromise): Promise<T> {
    const exec = (resolve: (r: T) => void, reject: (reason: string) => void) => {
        axiosPromise.then((r) => {
            if (r.status !== 200) {
                reject(`HTTP${r.status} ${r.statusText}`);
                return
            }
            const data = r.data as Response<T>;

            if (data.Code !== 100) {
                reject(`${data.Code}, ${data.Msg}`);
                return
            }
            resolve(data.Data)
        }).catch((reason) => {
            reject(reason)
        })
    };
    return new Promise<T>(exec);
}

function post_(path: string, data?: any): AxiosPromise {
    return axiosInstance.post(path, data)
}

function get_(path: string): AxiosPromise {
    return axiosInstance.get(path);
}


