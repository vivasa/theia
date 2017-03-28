import { TheiaApplication, TheiaPlugin } from '../../browser/application';
import { CommandRegistry } from '../../common/command';
import { ActionMenuNode, CompositeMenuNode, MAIN_MENU_BAR, MenuModelRegistry } from '../../common/menu';
import * as electron from 'electron';
import { inject, injectable } from 'inversify';

export function isOSX() {
  return typeof process !== 'undefined' && typeof process.platform !== 'undefined' && process.platform === 'darwin';
}

@injectable()
export class MainMenuFactory {

  constructor(
    @inject(CommandRegistry) private commandRegistry: CommandRegistry,
    @inject(MenuModelRegistry) private menuProvider: MenuModelRegistry) {
  }

  createMenuBar(): Electron.Menu {
    const menuModel = this.menuProvider.getMenu(MAIN_MENU_BAR);
    const template = this.fillMenuTemplate([], menuModel);
    if (isOSX()) {
      template.unshift(this.createOSXMenu());
    }
    return electron.remote.Menu.buildFromTemplate(template);
  }

  private fillMenuTemplate(items: Electron.MenuItemOptions[], menuModel: CompositeMenuNode): Electron.MenuItemOptions[] {
    for (let menu of menuModel.subMenus) {
      if (menu instanceof CompositeMenuNode) {
        if (menu.label) {
          // should we create a submenu?
          items.push({
            submenu: this.fillMenuTemplate([], menu)
          });
        } else {
          // or just a separator?
          items.push({
            type: 'separator'
          })
          // followed by the elements
          this.fillMenuTemplate(items, menu);
        }
      } else if (menu instanceof ActionMenuNode) {
        const command = this.commandRegistry.getCommand(menu.action.commandId);
        if (!command) {
          throw new Error(`Unknown command id: ${menu.action.commandId}.`);
        }
        let enabled = true;
        if (command.isEnabled) {
          enabled = command.isEnabled();
        }
        let visible = true;
        if (command.isVisible) {
          enabled = command.isVisible();
        }
        if (command) {
          items.push({
            label: menu.label,
            icon: menu.icon,
            enabled: enabled,
            visible: visible,
            click: () => command.execute(command)
          });
        }
      }
    }
    return items;
  }

  private createOSXMenu(): Electron.MenuItemOptions {
    return {
      label: 'Theia',
      submenu: [
        {
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    };
  }

}

@injectable()
export class MenuContribution implements TheiaPlugin {

  constructor( @inject(MainMenuFactory) private factory: MainMenuFactory) {
  }

  onStart(app: TheiaApplication): void {
    const itr = app.shell.children();
    let child = itr.next();
    while (child) {
      // Top panel for the menu contribution is not required for Electron.
      // TODO: Make sure this is the case on Windows too.
      if (child.id === 'theia-top-panel') {
        child.setHidden(true);
        child = undefined;
      } else {
        child = itr.next();
      }
    }
    electron.remote.Menu.setApplicationMenu(this.factory.createMenuBar());
  }

}