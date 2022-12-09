import { config } from 'dotenv';
config();
import { Client, GatewayIntentBits, Routes, SlashCommandBuilder, ChannelType } from 'discord.js';
import { REST } from '@discordjs/rest';
import schedule from 'node-schedule';
import fs from 'fs';
import { dumpSunscreenToJson } from './searchService.js'
import { scheduler } from 'timers/promises';

const commands = [
    new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Sets the time for the reminder!')
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


function scheduleReminder(time, channel) {
    var date = new Date(new Date().getTime + 1000);
    schedule.scheduleJob('0 ' + time + ' * * *', () => {
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
        channel.send("Hello Friends! Please remember to wear your sunscreen today! \n\nMay I suggest: \n" + item["title"] + " for " + item["price"] + "? \n" + item["link"]);
    });
}


client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    let cmd = interaction.commandName;
    switch (cmd) {
        case 'schedule':
            const time = interaction.options.getInteger('time');
            const channel = interaction.options.getChannel('channel');
            const config = {
                "time": time,
                "channel": channel
            }
            fs.writeFileSync('config.json', JSON.stringify(config));
            

            interaction.reply({
                content: `I will remind everyone every day at ${time}:00 EST!`
            })
            
            scheduleReminder(time, channel);
            break;
        case 'info':
            interaction.reply("I was made by Jadon! You can see my code here: \nhttps://github.com/jadon-gro/Sunscreen-Discord-Bot");
    }

    
    



    
    
})

async function main() {
    if (fs.existsSync('config.json')) {
        let config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
        scheduleReminder(config['time'], config['channel']);
    }
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


