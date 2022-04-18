import { Observable } from "rxjs";


type RxTransfer<T> = (source: Observable<T>) => Observable<T>;


export function onComplete<T>(r: () => void): RxTransfer<T> {
    return (source: Observable<T>) => {
        return new Observable<T>(observer => {
            return source.subscribe({
                next(res) { observer.next(res); },
                error(err) { observer.error(err); },
                complete() {
                    r();
                    observer.complete();
                }
            })
        });
    }
}


export function onNext<T>(r: (i: T) => void): RxTransfer<T> {
    return (source: Observable<T>) => {
        return new Observable<T>(observer => {
            return source.subscribe({
                next(res) {
                    r(res);
                    observer.next(res);
                },
                error(err) { observer.error(err); },
                complete() { observer.complete(); }
            })
        });
    }
}

export function onError<T>(r: (e: any) => void): RxTransfer<T> {
    return (source: Observable<T>) => {
        return new Observable<T>(observer => {
            return source.subscribe({
                next(res) { observer.next(res); },
                error(err) { 
                    r(err);
                    observer.error(err);
                },
                complete() { observer.complete(); }
            })
        });
    }
}
