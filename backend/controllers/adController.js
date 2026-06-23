const crypto = require("crypto");
const Ad = require("../models/Ad");

exports.listActive = async (_req, res) => res.json(await Ad.listActive());
exports.listAll = async (_req, res) => res.json(await Ad.listAll());

exports.upload = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const url = `${process.env.PUBLIC_BASE_URL}/files/ads/${req.file.filename}`;
  res.json({ url });
};

exports.create = async (req, res) => {
  const { heading, link_url } = req.body || {};
  if (!heading || !link_url) return res.status(400).json({ error: "heading and link_url required" });
  const id = crypto.randomUUID();
  await Ad.create({ id, ...req.body });
  res.json({ id });
};

exports.update = async (req, res) => {
  await Ad.update(req.params.id, req.body || {});
  res.json({ ok: true });
};

exports.remove = async (req, res) => {
  await Ad.remove(req.params.id);
  res.json({ ok: true });
};
