/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { Queue } from './queue';
import { expect } from 'chai';

describe('Queue', () => {

    const maxSize = 3;
    const equivalent = (left: number, right: number) => left === right;
    const options = { maxSize, equivalent };

    it('length does not exceeds maximum size', () => {
        const queue = new Queue<number>({ maxSize });
        queue.push(...[1, 2, 3, 4]);
        expect(queue.items.length).to.be.equal(3);
    });

    it('equivalent items are ignored if `equivalent` function is provided', () => {
        const queue = new Queue<number>(options);
        queue.push(...[1, 1]);
        expect(queue.items).to.be.deep.equal([1]);
    });

    it('equivalent items get reordered', () => {
        const queue = new Queue<number>(options);
        queue.push(...[1, 2, 3, 1]);
        expect(queue.items).to.be.deep.equal([2, 3, 1]);
    });

});
