/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as chai from 'chai';
import * as path from 'path';
import { FileSearchServiceImpl } from './file-search-service-impl';
import { FileUri } from '@theia/core/lib/node';
import { Container, ContainerModule } from 'inversify';
import { loggerBackendModule } from '@theia/core/lib/node/logger-backend-module';
import processBackendModule from '@theia/process/lib/node/process-backend-module';
import { CancellationTokenSource } from 'vscode-ws-jsonrpc/lib';

const expect = chai.expect;

const testContainer = new Container();

testContainer.load(loggerBackendModule);
testContainer.load(processBackendModule);
testContainer.load(new ContainerModule(bind => {
    bind(FileSearchServiceImpl).toSelf().inSingletonScope();
}));

describe('search-service', function () {

    this.timeout(10000);

    it('shall fuzzy search this spec file', async () => {
        const service = testContainer.get(FileSearchServiceImpl);
        const rootPath = path.resolve(__dirname, "..");
        const matches = await service.find('spc', { rootPath });
        const expectedFile = FileUri.create(__filename).displayName;
        const testFile = matches.find(e => e.endsWith(expectedFile));
        expect(testFile !== undefined);
    });

    it('shall respect nested .gitignore', async () => {
        const service = testContainer.get(FileSearchServiceImpl);
        const rootPath = path.resolve(__dirname, "../../test-resources");
        const matches = await service.find('foo', { rootPath, fuzzyMatch: false });

        expect(!matches.some(e => e.endsWith('subdir1/sub-bar/foo.txt')), matches.join(','));
        expect(matches.some(e => e.endsWith('subdir1/sub2/foo.txt')), matches.join(','));
        expect(matches.some(e => e.endsWith('subdir1/foo.txt')), matches.join(','));
    });

    it('shall cancel searches', async () => {
        const service = testContainer.get(FileSearchServiceImpl);
        const rootPath = path.resolve(__dirname, "../../../../..");
        const cancelTokenSource = new CancellationTokenSource();
        cancelTokenSource.cancel();
        const matches = await service.find('foo', { rootPath, fuzzyMatch: false }, cancelTokenSource.token);

        expect(matches.length === 0);
    });
});
