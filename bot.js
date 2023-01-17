require('dotenv').config();
const { Bot, session, GrammyError, HttpError, InputFile } = require("grammy");
const { run, sequentialize } = require("@grammyjs/runner");
const youtubeRegex = new RegExp(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+|^(www\.)?youtu\.be\/.+/);
const { URL } = require ("url");

// Create a bot
const bot = new Bot(process.env.BOT_TOKEN);

// Build a unique identifier for the `Context` object
function getSessionKey(ctx) {
  return ctx.chat?.id.toString();
}

// Sequentialize before accessing session data
bot.use(sequentialize(getSessionKey));
bot.use(session({ getSessionKey }));

// Measure response time

async function responseTime(ctx, next) {
  // take time before
  const before = Date.now(); // milliseconds
  // invoke downstream middleware
  await next(); // make sure to `await`!
  // take time after
  const after = Date.now(); // milliseconds
  // log difference
  console.log(`Response time: ${after - before} ms`);
}

bot.use(responseTime);

// Commands

bot.command("start", (ctx) => {
    ctx.reply("*Welcome!* ✨ Send a YouTube link to get the thumbnail.", { parse_mode: "Markdown" } );
    console.log("New user added:");
    console.log(ctx.from);
    });
bot.command("help", (ctx) => ctx.reply("*@anzubo Project\\.* \\\n\\\nThis bot uses the predictable URLs for thumbnails YouTube provides\\. It may break and stop working if YouTube decides to change this set pattern\\. It's designed to send the highest quality thumbnail available\\.", { parse_mode: "MarkdownV2" } ));

// Messages

bot
  .on("msg", async (ctx) => {
    // Console
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
        await ctx.replyWithPhoto(new InputFile(new URL(download_link)) );
      }
      else { let vid = link.split("/watch?v=")[1];
        let download_link = ("https://img.youtube.com/vi/" + vid + "/maxresdefault.jpg");
        await ctx.replyWithPhoto(new InputFile(new URL(download_link)) );
      }
      /*let download_link = ("https://img.youtube.com/vi/" + vid + "/maxresdefault.jpg");
      console.log(download_link);
      await ctx.replyWithPhoto(new InputFile(new URL(download_link)) );
        //{reply_to_message_id: ctx.msg.message_id });*/
    }
    else await ctx.reply(
      "Send a valid YouTube link!", {
      reply_to_message_id: ctx.msg.message_id }
      );
    });

// Error Handling

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  console.error("Details:");
  console.error("Query:", ctx.msg.text, "not found!");
  ctx.reply("Query: " + ctx.msg.text + " " + "not found!");
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
//console.log('CTRL+C to terminate.');

run(bot);