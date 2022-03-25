export function timeStampSecToDateTime(timestamp: number) {
    const date = new Date(timestamp * 1000);
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDay();
    const time = date.toTimeString().substr(0, 8);
    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + time;
}

export function timeStampSecToDate(timestamp: number) {
    const date = new Date(timestamp * 1000);
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDay();
    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " ;
}

export function getYearFromTimeStampSec(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return date.getFullYear();
}