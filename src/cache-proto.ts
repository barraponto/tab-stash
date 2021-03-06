"use strict";

// The protocol used to communicate between the cache-client and cache-server.

// CacheContent is an interface describing the type of content that can be
// stored in the cache.  It must be serializable to JSON.  It's up to the client
// to do proper type-checking.
//
// Note that `undefined` is excluded here for use as a sentinel value.  This
// shouldn't be too much of a burden on users since one can always use `null`
// instead.
export type CacheContent
    = null | boolean | string | number
    | CacheContentArray
    | CacheContentObject
    ;

export interface CacheContentArray extends Array<CacheContent> {}
export interface CacheContentObject {[key: string]: CacheContent}

// All of the messages that may be sent or received by client or service.
export type Message<Entry extends CacheContent>
    = FetchMessage
    | UpdateMessage<Entry>
    | ExpiredMessage
    ;

// Sent by the client to request the service's value for a particular key.  The
// expected response is an EntryMessage.
export type FetchMessage = {
    type: 'fetch',
    keys: string[],
};

// Can be sent independently by either the client or the service to notify the
// other of update(s), or sent in response to a FetchMessage.
export type UpdateMessage<Entry extends CacheContent> = {
    type: 'update',
    entries: {key: string, value: Entry}[],
};

export type ExpiredMessage = {
    type: 'expired',
    keys: string[],
};
