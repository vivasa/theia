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

import { RPCProtocolImpl, createExtensionProxyIdentifier } from '../api/rpc-protocol';
import { Emitter } from '@theia/core/lib/common/event';
import { Disposable } from '@theia/core/lib/common/disposable';
export interface MainThreadCommandsShape extends Disposable {
    $registerCommand(id: string): void;
    $unregisterCommand(id: string): void;
    $executeCommand<T>(id: string, args: any[]): Thenable<T>;
    $getCommands(): Thenable<string[]>;
}

const emmitter = new Emitter();
const rpc = new RPCProtocolImpl({
    onMessage: emmitter.event,
    send: (m: {}) => {
        postMessage(m);
    }
});
addEventListener('message', (message: any) => {
    emmitter.fire(message.data);
});

const ExtHostCommands = createExtensionProxyIdentifier<MainThreadCommandsShape>("MainThreadCommands");

const proxy = rpc.getProxy(ExtHostCommands);

proxy.$registerCommand('foo');
