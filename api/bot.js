require("dotenv").config();
const { Bot, webhookCallback, InputFile } = require("grammy");
const youtubeRegex = new RegExp(
  /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+|^(www\.)?youtu\.be\/.+/
);
const { URL } = require("url");

// DB

const mysql = require("mysql2");
const connection = mysql.createConnection(process.env.DATABASE_URL);

// Bot

const bot = new Bot(process.env.BOT_TOKEN);

// Response

async function responseTime(ctx, next) {
  const before = Date.now();
  await next();
  const after = Date.now();
  console.log(`Response time: ${after - before} ms`);
}

bot.use(responseTime);

// Commands

bot.command("start", async (ctx) => {
  await ctx
    .reply("*Welcome!* ✨ Send a YouTube link to get the thumbnail.", {
      parse_mode: "Markdown",
    })
    .then(() => {
      connection.query(
        `
  SELECT * FROM users WHERE userid = ?
`,
        [ctx.from.id],
        (error, results) => {
          if (error) throw error;
          if (results.length === 0) {
            connection.query(
              `
      INSERT INTO users (userid, username, firstName, lastName, firstSeen)
      VALUES (?, ?, ?, ?, NOW())
    `,
              [
                ctx.from.id,
                ctx.from.username,
                ctx.from.first_name,
                ctx.from.last_name,
              ],
              (error, results) => {
                if (error) throw error;
                console.log("New user added:", ctx.from);
              }
            );
          } else {
            console.log("User exists in database.", ctx.from.id);
          }
        }
      );
    })
    .catch((error) => console.error(error));
});

bot.command("help", async (ctx) => {
  await ctx
    .reply(
      "*@anzubo Project.*\n\nThis bot uses the predictable URLs for thumbnails YouTube provides. It may break and stop working if YouTube decides to change this pattern.",
      { parse_mode: "Markdown" }
    )
    .catch((error) => console.error(error));
});

// Messages

bot.on("msg", async (ctx) => {
  // Logging

  if (ctx.from.last_name === undefined) {
    console.log(
      "From:",
      ctx.from.first_name,
      "(@" + ctx.from.username + ")",
      "ID:",
      ctx.from.id
    );
  } else {
    console.log(
      "From:",
      ctx.from.first_name,
      ctx.from.last_name,
      "(@" + ctx.from.username + ")",
      "ID:",
      ctx.from.id
    );
  }
  console.log("Message:", ctx.msg.text);

  // Logic

  if (!youtubeRegex.test(ctx.msg.text)) {
    await ctx
      .reply("Send a valid YouTube link!", {
        reply_to_message_id: ctx.msg.message_id,
      })
      .catch((error) => console.error(error));
  } else {
    let message = ctx.message.text;
    let match = message.match(
      /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+|^(www\.)?youtu\.be\/.+/
    );
    let link = match[0];
    if (link.includes(".be/")) {
      let vid = link.split(".be/")[1];
      let download_link =
        "https://img.youtube.com/vi/" + vid + "/maxresdefault.jpg";
      await ctx
        .replyWithPhoto(new InputFile(new URL(download_link)))
        .catch((error) => console.error(error));
    } else {
      let vid = link.split("/watch?v=")[1];
      let download_link =
        "https://img.youtube.com/vi/" + vid + "/maxresdefault.jpg";
      await ctx
        .replyWithPhoto(new InputFile(new URL(download_link)))
        .catch((error) => console.error(error));
    }
  }
});

// Function

export default webhookCallback(bot, "http");
