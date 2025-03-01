// const {
//   buildTree,
//   buildPage,
//   buildField,
//   buildRecord,
//   getElement,
// } = require("../index.js");

// const { buildTree, getElement } = require("../dist/node-acrf-builder.js");
const {
  buildTree,
  getElement,
  buildXFDF,
  updateTree,
} = require("../index.js");
const fs = require("fs");
let path = ".\\demo";
let name = "FBP00001_20250219T114420.mcrf";
let obj = JSON.parse(fs.readFileSync(path + "\\" + name, "utf8"));
let refer = JSON.parse(fs.readFileSync(path + "\\METADATASDTM.json", "utf8"));
let tree = buildTree(obj, refer);
fs.writeFile(path + "\\meta.json", JSON.stringify(tree), (err) => {
  if (err) {
    console.log(err);
  }
});
let record = [
  {
    CDASHVAR: "ENRID",
    CRFDES: "Subject Enrollment ID",
    CRFDOM: "SUB",
    CRFDS: "SUB_ID",
    CRFVAR: "ENRID",
    HEIGHT: 15.744,
    ID: 1,
    SDTMDOM: "AE",
    // SDTMVAR: "SUBJID8",
    PAGENUMBER: 1,
  },
  {
    CDASHVAR: "ENRID",
    CRFDES: "Subject Enrollment ID",
    CRFDOM: "SUB",
    CRFDS: "SUB_ID",
    CRFVAR: "ENRID",
    HEIGHT: 15.744,
    ID: 1,
    SDTMDOM: "DM",
    PAGENUMBER: 1,
    NOTE:"DMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM"
  },
  {
    CDASHVAR: "ENRID",
    CRFDES: "Subject Enrollment ID",
    CRFDOM: "SUB",
    CRFDS: "SUB_ID",
    CRFVAR: "ENRID",
    HEIGHT: 15.744,
    ID: 1,
    SDTMDOM: "AE",
    SDTMVAR: "SUBJID1",
    NOTE:"AEAEAEAEAEAEAEAEAEAEAE",
    PAGENUMBER: 1,
  },
];
// console.log(tree);
// console.log(element);
// let element = getElement(tree);
let new_tree = updateTree(record, refer, tree);

fs.writeFile(path + "\\new_tree.json", JSON.stringify(new_tree), (err) => {
  if (err) {
    console.log(err);
  }
});

// fs.writeFile(path + "\\element.json", JSON.stringify(element), (err) => {
//   if (err) {
//     console.log(err);
//   }
// });

// fs.writeFile(path + "\\element.json", JSON.stringify(element), (err) => {
//   if (err) {
//     console.log(err);
//   }
// });
// let arr = JSON.parse(fs.readFileSync(path + "\\field.json", "utf8"));
// let field = buildField(obj, refer);
// let record = buildRecord(arr[1], refer);

// let arr = JSON.parse(fs.readFileSync(path + "\\page.json", "utf8"));
// let field = buildField(obj, refer);
// let page = buildPage(arr, refer);
// console.log(page);
// console.log(1);
// console.log(buildXFDF(tree));
// console.log(buildXFDF(tree, { filePath: path, fileName: "test" }));
