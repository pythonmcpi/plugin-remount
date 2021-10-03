const { Plugin } = require('powercord/entities');
const { getModule, channels: { getChannelId } } = require("powercord/webpack");
const util = require('util')

const DEVELOPMENT = false; // Adds a remount_remount command if set to true. Command remounts this plugin.

module.exports = class plugin_remount extends Plugin {
	async startPlugin() {
		const { BOT_AVATARS } = await getModule([ 'BOT_AVATARS' ]);
		const { createBotMessage } = await getModule([ 'createBotMessage' ]);
		
		powercord.api.commands.registerCommand({
			command: 'remount',
			description: 'Remounts (reloads) a plugin',
			usage: '{c} [ plugin ID ]',
			async executor (args) {
				let result;
				
				if (args[0] == 'plugin-remount') {
					result = `->> ERROR: You cannot remount this plugin because it provides this command.
		(${args[0]})`;
				} else {
					const orig_cons_err = console.error; // Very hacky, but I couldn't figure out any other solution.
					var recv_err = null;
					var raw_err = null;
					try {
						console.error = function(pre, col, tex) { recv_err = pre.replace("%c", "") + " " + tex }
						await powercord.pluginManager.remount(args[0]);
					} catch (error) {
						recv_err = util.inspect(error);
						raw_err = error;
					} finally {
						console.error = orig_cons_err;
					}
					
					if (recv_err != null) { // Sum Ting Wong
						if (raw_err) {
							console.error(raw_err);
						} else {
							console.error(recv_err);
						}
						
						result = `->> ERROR: An error occurred while remounting. (${args[0]})

${recv_err}`;
					} else { // Things should have worked
						result = `+>> SUCCESS: Plugin remounted!
		(${args[0]})`;
					}
				}
				
				return {
					send: false,
					result: `\`\`\`diff\n${result}\`\`\``
				};
			},
			autocomplete (args) { // This function is completely stolen from pc-moduleManager.
				const plugins = powercord.pluginManager.getPlugins()
					.sort((a, b) => a - b)
					.map(plugin => powercord.pluginManager.plugins.get(plugin));
				
				if (args.length > 1) {
					return false;
				}
				
				return {
					commands: plugins
						.filter(plugin => plugin.entityID.includes(args[0]))
						.map(plugin => ({
							command: plugin.entityID,
							description: plugin.manifest.description
						})),
					header: 'powercord plugin list'
				};
			}
		});
		
		if (DEVELOPMENT) {
			powercord.api.commands.registerCommand({
				command: 'remount_remount',
				description: 'Remount the plugin-remount plugin',
				usage: '{c}',
				executor (args) {
					powercord.pluginManager.remount('plugin-remount');
					return { send: false, result: "Hopefully it worked." }
				}
			});
		}
	}
	
	pluginWillUnload() {
		powercord.api.commands.unregisterCommand('remount');
		if (DEVELOPMENT) {
			powercord.api.commands.unregisterCommand('remount_remount');
		}
	}
}
