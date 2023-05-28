import {filter, map, Observable, Subject} from "rxjs";

export class EventBus {

    private _subject = new Subject<{ event: Event, data: any }>();


    private static instance: EventBus = new EventBus();

    private constructor() {

    }

    public static post(event: Event, data: any) {
        this.instance._subject.next({
            event: event,
            data: data
        });
    }

    public static event<T>(event: Event): Observable<T> {
        return this.instance._subject.pipe(
            filter((e) => e.event === event),
            map((e) => e.data)
        )
    }
}

export enum Event {
    ReplyMessage = "ReplyMessage",
}