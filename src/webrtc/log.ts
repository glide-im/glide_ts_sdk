

let logcb: ((s: string) => void) = () => { }

export function setLogCb(cb: (s: string) => void) {
    logcb = cb;
}

export function mLog(tag: string, msg: string) {
    const log = `[${tag}]: ${msg}`
    console.log('%c%s %c%s', 'color: #000000; font-weight: bold;', tag, 'color: #00aaaa; font-weight: thin;', msg);
    logcb(log);
}