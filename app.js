const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const axios = require("axios");
require('dotenv').config();

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.initialize();

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", async (message) => {
  if (message.body) {
    axios({
      url: `https://api.openai.com/v1/images/generations`,
      method: "post",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        prompt: message.body,
        n: 1,
        size: "1024x1024",
      },
    })
      .then(async (res) => {
        if (res.data.error) {
          message.reply("Something went wrong");
        } else {
          console.log(res.data);
          const media = await MessageMedia.fromUrl(res.data.data[0].url);
          client.sendMessage(message.from, media, {
            caption: `Image from: ${message.body}`,
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
});
