/*
 * Copyright (C) 2015-2018 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */
import { ContainerModule } from "inversify";
import { FrontendApplicationContribution, FrontendApplication } from "@theia/core/lib/browser";
import { MaybePromise } from "@theia/core/lib/common";
import { ExtensionWorker } from './extension-worker';
import { CommandRegistryMainImpl } from './command-registry-main';
import { EXTENSION_RPC_CONTEXT } from '../api/extension-api';

export default new ContainerModule(bind => {
    bind(ExtensionWorker).toSelf().inSingletonScope();
    bind(CommandRegistryMainImpl).toSelf().inSingletonScope();
    // bind(FrontendApplicationContribution).toService(ExtensionWorker);
    bind(FrontendApplicationContribution).toDynamicValue(ctx => ({
        onStart(app: FrontendApplication): MaybePromise<void> {
            const worker = ctx.container.get(ExtensionWorker);
            const commandRegistryMain = ctx.container.get(CommandRegistryMainImpl);
            worker.rpc.set(EXTENSION_RPC_CONTEXT.COMMAND_REGISTRY_MAIN, commandRegistryMain);
        }
    }));
});
