import {expect} from 'chai';

let verbose = false;

let queue: (() => void)[] = [];
let resolve: (() => void) | undefined;
let reject: ((e: Error) => void) | undefined;
let requested_count: number = 0;
let delivered_count: number = 0;

type Args<F extends (...args: any[]) => any> =
    F extends (...args: infer A) => any ? A : void;

export class MockEventDispatcher<Fn extends (...args: any[]) => void> {
    name: string;
    _listeners: Fn[] = [];

    constructor(name: string) {
        this.name = name;
    }

    addListener(l: Fn) {
        expect(l).to.be.a('function');
        this._listeners.push(l);
    }

    send(...args: Args<Fn>) {
        queue.push(() => {
            if (verbose) console.log(`[${this.name}] `, ...args);
            for (const fn of this._listeners) fn(...args);
        });
        if (resolve) setImmediate(deliver);
    }
}

export function drain(count: number): Promise<void> {
    if (resolve || reject) {
        throw new Error(`Tried to call drain() re-entrantly`);
    }
    expect(requested_count, `requested_count`).to.equal(0);
    expect(delivered_count, `delivered_count`).to.equal(0);

    if (verbose) console.log(`Draining ${count} events`);

    return new Promise((res, rej) => {
        requested_count = count;
        resolve = res;
        reject = rej;
        if (queue.length > 0) setImmediate(deliver);
    });
}

export function expect_empty() {
    expect(resolve, `event waiter (resolve)`).to.be.undefined;
    expect(reject, `event waiter (reject)`).to.be.undefined;
    expect(requested_count, `requested events count`).to.equal(0);
    expect(delivered_count, `delivered events count`).to.equal(0);
    expect(queue.length, `event queue length`).to.equal(0);
}

export function trace(t: boolean) {
    verbose = t;
}

function deliver() {
    const q = queue;
    queue = [];

    for (const fn of q) fn();
    delivered_count += q.length;

    if (resolve && reject && delivered_count >= requested_count) {
        if (delivered_count > requested_count) {
            reject(new Error(`Delivered ${delivered_count} events, but expected only ${requested_count} events`));
            delivered_count -= requested_count;
        } else {
            delivered_count = 0;
            resolve();
        }

        requested_count = 0;
        resolve = undefined;
        reject = undefined;
    }
}
