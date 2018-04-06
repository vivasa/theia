/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from 'inversify';
import { QuickFileOpenService } from './quick-file-open';
import { Command, CommandRegistry, CommandContribution } from '@theia/core/lib/common';
import { KeybindingRegistry, KeybindingContribution } from '@theia/core/lib/browser';

export const quickFileOpen: Command = {
    id: 'file-search.openFile',
    label: 'Open File ...'
};

@injectable()
export class QuickFileOpenFrontendContribution implements CommandContribution, KeybindingContribution {

    constructor(@inject(QuickFileOpenService) protected readonly quickFileOpenService: QuickFileOpenService) { }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(quickFileOpen, {
            execute: () => this.quickFileOpenService.open(),
            isEnabled: () => this.quickFileOpenService.isEnabled()
        });
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeybinding({
            command: quickFileOpen.id,
            keybinding: "ctrlcmd+p"
        });
    }

}
