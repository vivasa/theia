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
import { ExtensionApiContribution } from './extension-service';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';

export default new ContainerModule(bind => {
    bind(ExtensionApiContribution).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toDynamicValue(ctx => ctx.container.get(ExtensionApiContribution)).inSingletonScope();
});
