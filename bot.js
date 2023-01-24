require('dotenv').config();
const { Bot, session, GrammyError, HttpError, InputFile } = require("grammy");
const { run, sequentialize } = require("@grammyjs/runner");
const youtubeRegex = new RegExp(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+|^(www\.)?youtu\.be\/.+/);
const { URL } = require ("url");

// Bot

const bot = new Bot(process.env.BOT_TOKEN);

// Concurrency

function getSessionKey(ctx) {
  return ctx.chat?.id.toString(); }

bot.use(sequentialize(getSessionKey));
bot.use(session({ getSessionKey }));

// Commands

bot.command("start", (ctx) => {
    ctx.reply("*Welcome!* ✨ Send a YouTube link to get the thumbnail.", { parse_mode: "Markdown" } );
    console.log("New user added:");
    console.log(ctx.from);
  });
bot.command("help", (ctx) => ctx.reply("*@anzubo Project.* \n\nThis bot uses the predictable URLs for thumbnails YouTube provides. It may break and stop working if YouTube decides to change this pattern. It's designed to send the highest quality thumbnail available.", { parse_mode: "Markdown" } ));

// Messages

bot
  .on("msg", async (ctx) => {
    
    // Logging

    if (ctx.from.last_name === undefined) {
      console.log('from:', ctx.from.first_name, '(@' + ctx.from.username + ')', 'ID:', ctx.from.id); }
    else { console.log('from:', ctx.from.first_name, ctx.from.last_name, '(@' + ctx.from.username + ')', 'ID:', ctx.from.id); }
    console.log("Message:", ctx.msg.text);

    // Logic

    if (youtubeRegex.test(ctx.msg.text)) {
      let message = ctx.message.text;
      let match = message.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+|^(www\.)?youtu\.be\/.+/);
      let link = match[0];
      if (link.includes(".be/")) { let vid = link.split(".be/")[1];
        let download_link = ("https://img.youtube.com/vi/" + vid + "/maxresdefault.jpg");
        await ctx.replyWithPhoto(new InputFile(new URL(download_link)) ); }
      else { let vid = link.split("/watch?v=")[1];
        let download_link = ("https://img.youtube.com/vi/" + vid + "/maxresdefault.jpg");
        await ctx.replyWithPhoto(new InputFile(new URL(download_link)) ); }
      }
    else await ctx.reply("Send a valid YouTube link!", { reply_to_message_id: ctx.msg.message_id } );
    
  });

// Error Handling

bot.catch((err) => {
  const ctx = err.ctx;
  console.error("Error while handling update", ctx.update.update_id, "\nQuery:", ctx.msg.text, "not found");
  if (ctx.config.isDeveloper) { ctx.reply("Query: " + ctx.msg.text + " " + "not found!"); }
  else { bot.api.sendMessage(ctx.config.botDeveloper, "Query: " + ctx.msg.text + " by @" + ctx.from.username + " ID: " + ctx.from.id + " not found!"); }
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

// Run it concurrently

console.log('Bot running. Please keep this window open or use a startup manager like PM2 to setup persistent execution and store logs.');
run(bot);