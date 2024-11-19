const path = require("path");
const fs = require("fs");

const db = require("../models");

const logger = require("../logger");

exports.create = (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ message: "File uploaded successfully" }));
};
