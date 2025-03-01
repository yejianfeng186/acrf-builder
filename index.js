// import resolvePlugin from "@rollup/plugin-node-resolve";
const { getElement,calcArea } = require("./src/util.js");
const { Parser } = require("./src/state.js");
require("./src/node.js");
require("./src/init.js");
const { buildXFDF } = require("./src/builder.js");

function buildTree(obj, refer) {
  return Parser.parse(obj, refer);
}
function buildPage(obj, refer) {
  return Parser.parseTarget(obj, refer).buildPage();
}
function buildField(obj, refer) {
  return Parser.parseTarget(obj, refer).buildField();
}
function buildRecord(obj, refer) {
  return Parser.parseTarget(obj, refer).buildRecord();
}
function updateTree(obj, refer, tree) {
  return Parser.parseTarget(obj, refer).updateTree(tree);
}

module.exports = {
  buildTree,
  buildPage,
  buildField,
  buildRecord,
  getElement,
  calcArea,
  updateTree,
  buildXFDF,
};
