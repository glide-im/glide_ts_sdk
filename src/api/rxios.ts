import { AxiosInstance, AxiosPromise } from "axios";
import { map, Observable, OperatorFunction } from "rxjs";
import { axiosInstance } from "./axios";
import { Response } from "./response";

interface HttpResponse {
    status: number;
    msg: string;
    headers: any;
    data: any;
}

export class Rxios {
    private _axios: AxiosInstance;

    constructor(a: AxiosInstance) {
        this._axios = a
    }

    public post<T>(url: string, data?: any): Observable<T> {
        return this
            .fromAxios(() => this._axios.post(url, data))
            .pipe(this.mapResponse<T>())
    }

    public put<T>(url: string, data?: any): Observable<T> {
        return this.fromAxios(() => this._axios.put(url, data)).pipe(this.mapResponse<T>())
    }

    public patch<T>(url: string, data?: any): Observable<T> {
        return this.fromAxios(() => this._axios.patch(url, data)).pipe(this.mapResponse<T>())
    }

    public get<T>(url: string): Observable<T> {
        return this.fromAxios(() => this._axios.get(url)).pipe(this.mapResponse<T>())
    }

    private mapResponse<T>(): OperatorFunction<HttpResponse, T> {
        return map<HttpResponse, T>(response => {
            if (response.status !== 200) {
                throw new Error(response.msg);
            }
            const s = response.data as Response<T>;
            if (s.Code !== 100) {
                throw new Error(s.Code + "," + s.Msg);
            }
            return s.Data
        })
    }

    private fromAxios(fn: () => AxiosPromise): Observable<HttpResponse> {
        return new Observable(observer => {
            fn().then((response) => {
                observer.next({
                    status: response.status,
                    msg: response.statusText,
                    headers: response.headers,
                    data: response.data
                });
                observer.complete();
            }).catch((error) => {
                observer.error(error);
                observer.complete();
            })
        })
    }
}

export const rxios = new Rxios(axiosInstance);