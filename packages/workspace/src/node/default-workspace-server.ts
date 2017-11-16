/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as path from 'path';
import * as yargs from 'yargs';

import { injectable, inject } from "inversify";
import URI from '@theia/core/lib/common/uri';
import { FileUri } from '@theia/core/lib/node';
import { CliContribution } from '@theia/core/lib/node/cli';
import { Queue } from '@theia/core/lib/common/queue';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { WorkspaceServer } from "../common";
import { FileSystem, FileStat } from '@theia/filesystem/lib/common';

@injectable()
export class WorkspaceCliContribution implements CliContribution {

    workspaceRoot = new Deferred<string | undefined>();

    configure(conf: yargs.Argv): void {
        conf.usage("$0 [workspace-directory] [options]");
        conf.option('root-dir', {
            description: 'DEPRECATED: Sets the workspace directory.',
        });
    }

    setArguments(args: yargs.Arguments): void {
        let wsPath = args._[2];
        if (!wsPath) {
            wsPath = args['root-dir'];
            if (!wsPath) {
                this.workspaceRoot.resolve();
                return;
            }
        }
        if (!path.isAbsolute(wsPath)) {
            const cwd = process.cwd();
            wsPath = path.join(cwd, wsPath);
        }
        this.workspaceRoot.resolve(wsPath);
    }
}

@injectable()
export class DefaultWorkspaceServer implements WorkspaceServer {

    protected root: Promise<string | undefined>;

    constructor(
        @inject(WorkspaceCliContribution) protected readonly cliParams: WorkspaceCliContribution,
        @inject(FileSystem) protected readonly fileSystem: FileSystem
    ) {
        this.root = this.getRootURIFromCli();
        this.root.then(async root => {
            if (!root) {
                const data = await this.readFromUserStorage();
                if (data.recentRoots.length > 0) {
                    this.root = Promise.resolve(data.recentRoots[0]);
                }
            }
        });
    }

    async getRoot(): Promise<string | undefined> {
        return this.root;
    }

    async setRoot(uri: string): Promise<void> {
        this.root = Promise.resolve(uri);
        const recentRoots = await this.calculateRecentRoots(uri);
        await this.writeToUserStorage({ recentRoots });
    }

    async getRecentlySelectedRoots(): Promise<string[]> {
        return (await this.readFromUserStorage()).recentRoots;
    }

    protected async getRootURIFromCli(): Promise<string | undefined> {
        const arg = await this.cliParams.workspaceRoot.promise;
        return arg !== undefined ? FileUri.create(arg).toString() : undefined;
    }

    /**
     * Resolves to a file stat representing the destination resource that can be used to store the workspace related metadata.
     * If the file does not exist, then returns with its desired location as an URI.
     */
    protected async getUserStorage(): Promise<FileStat | string> {
        const userHome = await this.fileSystem.getCurrentUserHome();
        const uri = new URI(userHome.uri).resolve('.theia').resolve('recentworkspace.json');
        if (this.fileSystem.exists(uri.toString())) {
            return this.fileSystem.getFileStat(uri.toString());
        }
        return uri.toString();
    }

    /**
     * Writes the given uri as the most recently used workspace root to the user's home directory.
     * @param uri most recently used uri
     */
    private async writeToUserStorage(data: WorkspaceData): Promise<void> {
        const content = JSON.stringify(data);
        const userStorage = await this.getUserStorage();
        if (typeof userStorage === 'string') {
            await this.fileSystem.createFile(userStorage, { content });
        } else {
            await this.fileSystem.setContent(userStorage, JSON.stringify(data));
        }
    }

    /**
     * Reads the most recently used workspace root from the user's home directory.
     */
    private async readFromUserStorage(): Promise<WorkspaceData> {
        const userStorage = await this.getUserStorage();
        if (typeof userStorage !== 'string') {
            const config = await this.fileSystem.resolveContent(userStorage.uri);
            if (WorkspaceData.is(config)) {
                return config;
            }
        }
        return { recentRoots: [] };
    }

    /**
     * Gets the recently opened workspace roots and updates it with the argument.
     */
    private async calculateRecentRoots(uri: string): Promise<string[]> {
        const recentRoots = await this.getRecentlySelectedRoots();
        const queue = new Queue({
            maxSize: 5,
            equivalent: (left: string, right: string) => left === right
        });
        queue.push(...recentRoots.reverse(), uri);
        return queue.items.reverse();
    }

}

interface WorkspaceData {
    recentRoots: string[];
}

namespace WorkspaceData {
    // tslint:disable-next-line:no-any
    export function is(data: any): data is WorkspaceData {
        return data.recentRoots !== undefined;
    }
}
