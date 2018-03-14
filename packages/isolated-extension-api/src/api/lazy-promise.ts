/*
 * Copyright (C) 2018 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

export class LazyPromise implements Promise<any> {

    [Symbol.toStringTag]: "Promise";

    private actual: Promise<any> | undefined;
    private actualOk: { (val: any): void } | undefined;
    private actualErr: { (val: any): void } | undefined;

    private hasValue: boolean;
    private value: any | undefined;

    private hasErr: boolean;
    private err: any | undefined;

    private isCanceled: boolean;

    constructor() {
        this.actual = undefined;
        this.actualOk = undefined;
        this.actualErr = undefined;
        this.hasValue = false;
        this.value = undefined;
        this.hasErr = false;
        this.err = undefined;
        this.isCanceled = false;
    }

    private ensureActual(): Promise<any> {
        if (!this.actual) {
            this.actual = new Promise<any>((c, e) => {
                this.actualOk = c;
                this.actualErr = e;
            });

            if (this.hasValue && this.actualOk) {
                this.actualOk(this.value);
            }

            if (this.hasErr && this.actualErr) {
                this.actualErr(this.err);
            }
        }
        return this.actual;
    }

    public resolveOk(value: any): void {
        if (this.isCanceled || this.hasErr) {
            return;
        }

        this.hasValue = true;
        this.value = value;

        if (this.actual && this.actualOk) {
            this.actualOk(value);
        }
    }

    public resolveErr(err: any): void {
        if (this.isCanceled || this.hasValue) {
            return;
        }

        this.hasErr = true;
        this.err = err;

        if (this.actual && this.actualErr) {
            this.actualErr(err);
        } else {
            // onUnexpectedError(err);
            // TODO
            console.error(err);
        }
    }

    public then(success: any, error: any): any {
        if (this.isCanceled) {
            return;
        }

        return this.ensureActual().then(success, error);
    }

    public catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<TResult> {
        if (this.isCanceled) {
            return this;
        }

        return this.ensureActual().catch(onrejected);
    }
}
