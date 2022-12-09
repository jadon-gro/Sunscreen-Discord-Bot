import { config } from 'dotenv';
config();
import { Client, GatewayIntentBits, Routes, SlashCommandBuilder, ChannelType } from 'discord.js';
import { REST } from '@discordjs/rest';
import schedule from 'node-schedule';
import fs from 'fs';
import { dumpSunscreenToJson } from './imgService.js'

const commands = [
    new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Schedules a message')
    .addIntegerOption(option => 
        option
            .setName("time")
            .setDescription("Hour of day from 1-24")
            .setMinValue(1)
            .setMaxValue(24)
            .setRequired(true)   
    )
    .addChannelOption(option =>
        option
            .setName("channel")
            .setDescription("The channel the message should be sent to")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
    )
    .toJSON(),

    new SlashCommandBuilder()
    .setName('info')
    .setDescription("Get more information about the bot")
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});





client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    let cmd = interaction.commandName;
    switch (cmd) {
        case 'schedule':
            const time = interaction.options.getInteger('time');
            const channel = interaction.options.getChannel('channel');

            interaction.reply({
                content: `Your message has been scheduled for ${time}:00 EST`
            })
            var searchResults;
            if (!fs.existsSync("Sunscreen_Search_Results.json")) {
                dumpSunscreenToJson();
            }
            var text = fs.readFileSync('Sunscreen_Search_Results.json', 'utf-8' )
            searchResults = JSON.parse(text.toString())
            if (searchResults['index'] + 2 >= searchResults['shopping_results'].length) {
                dumpSunscreenToJson();
            } else {
                searchResults['index'] += 1;
                fs.writeFile('Sunscreen_Search_Results.json', JSON.stringify(searchResults), err => {
                    if (err) {
                        throw err;
                    }
                });
            }
            const item = searchResults["shopping_results"][Number(searchResults['index'])];
            schedule.scheduleJob('39 ' + time + ' * * *', () => {
                channel.send("Hello Friends! Please remember to wear your sunscreen! \nMay I suggest " + item["title"] + " for " + item["price"] + "? \n" + item["link"]);
            });
            break;
        case 'info':
            interaction.reply("This was a bot made by Jadon! You can see my code here: \nhttps://github.com/jadon-gro/Sunscreen-Discord-Bot");
    }

    
    



    
    
})

async function main() {
    try {
        
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
            body: commands,
        });
        client.login(process.env.DISCORD_TOKEN);
    } catch (err) {
        console.error(err)
    }
}

main()


