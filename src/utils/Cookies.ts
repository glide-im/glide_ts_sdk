
export function setCookie(name: string, value: string, expireDays: number) {
    let exp = new Date();
    exp.setTime(exp.getTime() + expireDays * 24 * 60 * 60 * 1000);
    document.cookie = name + "=" + value + ";expires=" + exp.toUTCString();
}

export function getCookie(name: string): string | null {
    let reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
    let arr = document.cookie.match(reg);
    if (arr !== null)
        return arr[2];
    else
        return null;
}

export function delCookie(name: string) {
    const exp = new Date();
    exp.setTime(exp.getTime() - 1);
    const cval = getCookie(name);
    if (cval != null)
        document.cookie = name + "=" + cval + ";expires=" + exp.toUTCString();
}