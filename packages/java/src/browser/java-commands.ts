/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { inject, injectable } from "inversify";
import { ExecuteCommandRequest } from "monaco-languageclient/lib";
import { CommandContribution, CommandRegistry, Command, MenuContribution, MenuModelRegistry } from '@theia/core/lib/common';
import { EditorCommands, EDITOR_CONTEXT_MENU, EditorManager } from "@theia/editor/lib/browser";
import { KeybindingContribution, KeybindingRegistry } from "@theia/core/lib/browser";
import { WorkspaceEdit, Workspace } from "@theia/languages/lib/common";
import { JavaClientContribution } from "./java-client-contribution";
import { JavaKeybindingContexts } from "./java-keybinding-contexts";

/**
 * Show Java references
 */
export const SHOW_JAVA_REFERENCES: Command = {
    id: 'java.show.references'
};

/**
 * Apply Workspace Edit
 */
export const APPLY_WORKSPACE_EDIT: Command = {
    id: 'java.apply.workspaceEdit'
};

/**
 * Organize Imports
 */
export const JAVA_ORGANIZE_IMPORTS: Command = {
    label: 'Java: Organize Imports',
    id: 'java.edit.organizeImports'
};

@injectable()
export class JavaCommandContribution implements CommandContribution, MenuContribution, KeybindingContribution {

    @inject(Workspace)
    protected readonly workspace: Workspace;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(JavaClientContribution)
    protected readonly javaClientContribution: JavaClientContribution;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(SHOW_JAVA_REFERENCES, {
            execute: (uri: string, position: Position, locations: Location[]) =>
                commands.executeCommand(EditorCommands.SHOW_REFERENCES.id, uri, position, locations)
        });
        commands.registerCommand(APPLY_WORKSPACE_EDIT, {
            execute: (changes: WorkspaceEdit) =>
                !!this.workspace.applyEdit && this.workspace.applyEdit(changes)
        });
        commands.registerCommand(JAVA_ORGANIZE_IMPORTS, {
            execute: async (changes: WorkspaceEdit) => {
                const editor = this.editorManager.currentEditor;
                if (!editor) {
                    return false;
                }
                const uri = editor.editor.uri.toString();
                const client = await this.javaClientContribution.languageClient;
                const result = await client.sendRequest(ExecuteCommandRequest.type, {
                    command: JAVA_ORGANIZE_IMPORTS.id,
                    arguments: [
                        uri
                    ]
                });
                if (isWorkspaceEdit(result) && this.workspace.applyEdit) {
                    return await this.workspace.applyEdit(result);
                } else {
                    return false;
                }
            },
            isVisible: () => !!this.editorManager.currentEditor,
            isEnabled: () => !!this.editorManager.currentEditor
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction([...EDITOR_CONTEXT_MENU, '1_modification'], {
            commandId: JAVA_ORGANIZE_IMPORTS.id,
            label: 'Organize Imports'
        });
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeybinding({
            command: JAVA_ORGANIZE_IMPORTS.id,
            context: JavaKeybindingContexts.javaEditorTextFocus,
            keybinding: 'ctrlcmd+shift+o'
        });
    }
}

function isWorkspaceEdit(edit?: object): edit is WorkspaceEdit {
    return !!edit && ('changes' in edit || 'documentchanges' in edit);
}
