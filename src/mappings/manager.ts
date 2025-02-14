import { ExtensionContext, workspace } from 'coc.nvim';
import { MappingMode } from '../actions/types';
import { ExplorerManager } from '../explorerManager';
import { keyMapping } from '../mappings';
import { logger } from '../util';

/**
 * mappings[mode][key] = '<Plug>(coc-action-mode-key)'
 */
const mappings: Record<string, Record<string, string>> = {};

export async function registerMappings(
  context: ExtensionContext,
  explorerManager: ExplorerManager,
) {
  const commonKeys = [...(await keyMapping.getCommonKeys())];
  const keysModes: [MappingMode, string[]][] = [
    ['n', commonKeys],
    ['v', [...commonKeys, ...(await keyMapping.getVisualKeys())]],
  ];
  for (const [mode, keys] of keysModes) {
    mappings[mode] = {};
    for (const key of keys) {
      if (mappings[mode][key]) {
        continue;
      }
      if (mode === 'v' && ['o', 'j', 'k'].includes(key)) {
        continue;
      }
      const plugKey = `explorer-key-${mode}-${key.replace(/<(.*)>/, '[$1]')}`;
      context.subscriptions.push(
        workspace.registerKeymap([mode], plugKey, async () => {
          const count = (await workspace.nvim.eval('v:count')) as number;
          const explorer = await explorerManager.currentExplorer();
          explorer?.action
            .doActionByKey(key, mode, count || 1)
            .catch(logger.error);
        }),
      );
      mappings[mode][key] = `<Plug>(coc-${plugKey})`;
    }
  }
  await workspace.nvim.call('coc_explorer#mappings#register', [mappings]);
  // await events.fire('registeredMapping');
}

export async function executeMappings() {
  await workspace.nvim.call('coc_explorer#mappings#execute', [mappings]);
}

export async function clearMappings() {
  await workspace.nvim.call('coc_explorer#mappings#clear', [mappings]);
}
