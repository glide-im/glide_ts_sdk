export function timeStampSecToDateTime(timestamp: number) {
    const date = new Date(timestamp * 1000);
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDay();
    const time = date.toTimeString().substr(0, 8);
    return (
        y +
        '-' +
        (m < 10 ? '0' + m : m) +
        '-' +
        (d < 10 ? '0' + d : d) +
        ' ' +
        time
    );
}

// if less than 1 minute, show "just now"
// if less than 1 hour, show "xx minutes ago"
// if less than 2 hours, show the hour and minute
// if is yesterday, show "yesterday" and am/pm
// if is this week, show the day of week and am/pm
// else show the date
export function time2Str(timestamp: number): string {
    if (timestamp === undefined || timestamp === 0) {
        return '';
    }

    const isMilliSec = timestamp > 10000000000;
    if (!isMilliSec) {
        timestamp *= 1000;
    }
    const now = new Date();
    const date = new Date(timestamp);

    const diff = now.getTime() - timestamp;
    const isYesterday = date.getDate() === now.getDate() - 1;

    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const hourStr = hour < 10 ? '0' + hour : hour.toString();
    const minuteStr = minute < 10 ? '0' + minute : minute.toString();
    const month = date.getMonth();
    const day = date.getDate();

    const isThisWeek = 7 - dayOfWeek + now.getDay() < 7;
    const isToday = date.getDate() === now.getDate();

    if (diff < 60000) {
        return '刚刚';
    }
    if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前';
    }
    if (isToday) {
        return hourStr + ':' + minuteStr;
    }
    if (isYesterday) {
        return '昨天' + hourStr + ':' + minuteStr;
    }
    if (isThisWeek) {
        return dayOfWeek2Str(dayOfWeek) + hourStr + ':' + minuteStr;
    }
    return month + 1 + '-' + day + ' ' + hourStr + ':' + minuteStr;
}

function dayOfWeek2Str(day: number) {
    switch (day) {
        case 0:
            return '周日';
        case 1:
            return '周一';
        case 2:
            return '周二';
        case 3:
            return '周三';
        case 4:
            return '周四';
        case 5:
            return '周五';
        case 6:
            return '周六';
    }
}

export function time2HourMinute(timestamp: number) {
    const isMilliSec = timestamp > 10000000000;
    if (!isMilliSec) {
        timestamp *= 1000;
    }
    const date = new Date(timestamp);
    return (
        (date.getHours() < 10 ? '0' : '') +
        date.getHours() +
        ':' +
        (date.getMinutes() < 10 ? '0' : '') +
        date.getMinutes()
    );
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
    return (
        y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d) + ' '
    );
}

export function getYearFromTimeStampSec(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return date.getFullYear();
}
