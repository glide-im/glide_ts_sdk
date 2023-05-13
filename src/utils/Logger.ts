export class Logger {

    static log(tag: string, ...args: any[]) {
        console.log(`[${tag}]`, ...args);
    }

    static error(tag: string, ...args: any[]) {
        console.error(`[${tag}]`,...args);
    }

    static warn(tag: string, ...args: any[]) {
        console.warn(`[${tag}]`,...args);
    }

    static info(tag: string, ...args: any[]) {
        console.info(`[${tag}]`,...args);
    }
}