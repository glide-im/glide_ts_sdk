export function timeStampSecToDateTime(timestamp: number) {
    const date = new Date(timestamp * 1000);
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDay();
    const time = date.toTimeString().substr(0, 8);
    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + time;
}

// if less than 1 minute, show "just now"
// if less than 1 hour, show "xx minutes ago"
// if less than 2 hours, show the hour and minute
export function time2Str(timestamp: number) {
    const isMilliSec = timestamp > 10000000000;
    if (!isMilliSec) {
        timestamp *= 1000;
    }
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60 * 1000) {
        return "just now";
    } else if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + " minutes ago";
    } else if (diff < 2 * 60 * 60 * 1000) {
        const date = new Date(timestamp);
        return date.getHours() + ":" + date.getMinutes();
    } else {
        return timeStampSecToDateTime(timestamp / 1000);
    }
}

export function time2HourMinute(timestamp: number) {
    const isMilliSec = timestamp > 10000000000;
    if (!isMilliSec) {
        timestamp *= 1000;
    }
    const date = new Date(timestamp);
    return date.getHours() + ":" + date.getMinutes();
}

export function timeStampSecToDate(timestamp: number) {
    const isMilliSec = timestamp > 10000000000;
    if (!isMilliSec) {
        timestamp *= 1000;
    }
    const date = new Date(timestamp);
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDay();
    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " ";
}

export function getYearFromTimeStampSec(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return date.getFullYear();
}