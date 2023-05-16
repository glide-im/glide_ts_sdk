export interface Response<T> {
    Msg: string
    Code: number
    Data: T
}

export function isResponse<T>(data: any): data is Response<T> {
    return data.hasOwnProperty("Code") && data.hasOwnProperty("Data") && data.hasOwnProperty("Msg")
}