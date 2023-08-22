const qrcode = require("qrcode");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const axios = require("axios");
require('dotenv').config();
const express = require("express");

const app = express();
app.use(express.static("public"));

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.initialize();

let qrSvg = "";

client.on("qr", (qr) => {
  qrcode.toDataURL(qr, { errorCorrectionLevel: 'H' }, function(err, url) {
    qrSvg = url;
  });
});

app.get("/qr", (req, res) => {
  res.send(qrSvg);
});

let isAuthenticated = false;

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
  isAuthenticated = true;
});

app.get("/auth-status", (req, res) => {
  res.send(isAuthenticated);
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

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
