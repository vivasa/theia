/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Basic queue implementation. Can be configured to avoid duplicate items,
 * so it can be used to manage some sort of chronological order among the contained items.
 */
export class Queue<T> {

    private _items: T[];

    private readonly maxSize: number;
    private readonly equivalent: ((left: T, right: T) => boolean) | undefined;

    constructor(options?: QueueOptions<T>) {
        this._items = [];
        this.maxSize = options && options.maxSize && options.maxSize > 0 ? options.maxSize : Number.MAX_SAFE_INTEGER;
        this.equivalent = options && options.equivalent ? options.equivalent : undefined;
    }

    /**
     * Appends the argument ot the head of the queue. If the item was already "in" the queue, it removes the existing one,
     * then appends the argument. Also makes sure, that the length of the queue never exceeds the maximum allowed size.
     * If that would be the case, trims items from the tail of the queue.
     *
     * @param items the items to append to this queue.
     */
    push(...items: T[]): void {
        for (const item of items) {
            if (this.equivalent) {
                const index = this._items.findIndex(i => this.equivalent!(item, i));
                if (index !== -1) {
                    this._items.splice(index, 1);
                }
            }
            this._items.push(item);
            if (this._items.length > this.maxSize) {
                this._items.shift();
            }
        }
    }

    /**
     * Returns with a copy of the items contained in this queue. The returning array is
     * "chronologically" ordered: the first item is the oldest and the last one is the
     * most recent one.
     */
    get items(): T[] {
        return this._items.slice();
    }

}

/**
 * Options for the queue construction.
 */
export interface QueueOptions<T> {

    /**
     * The maximum number of items allowed in the queue. Non positive numbers mean unlimited size.
     */
    maxSize?: number,

    /**
     * If specified, no duplicates are allowed in the queue. Equivalence is checked via this function.
     * Returns `true` if the two arguments are equal. Otherwise, `false`.
     *
     * If `equivalent` is not set, then the queue allows duplicate items.
     */
    equivalent?(left: T, right: T): boolean

}
