// require("./util.js");
const builder = require("xmlbuilder2");
const moment = require("moment");
const fs = require("fs");
const { getElement } = require("./util.js");

function buildXFDF(target, option) {
  let strCurrentDatetime = moment().format("YYYYMMDD[T]HHmmss");
  let root = builder.create({ version: "1.0" });
  let xmlXFDF = root.ele("xfdf");
  const metadata = getElement(target);
  // const elements = metadata.element;
  const { style, elements } = metadata;
  if (!option) option = {};
  const { filePath, fileName } = option;
  xmlXFDF.att("xmlns", "http://ns.adobe.com/xfdf/");
  xmlXFDF.att("xml:space", "preserve");
  let xmlAnnots = xmlXFDF.ele("annots");
  for (let i = 0; i < elements.length; i++) {
    // const element = ;
    createFreeText(xmlAnnots, elements[i], style);
  }

  let xmlF = xmlXFDF.ele("f");
  xmlF.att("href", "acrf.pdf");
  let annots = xmlXFDF.end({
    pretty: false,
  });

  if (!filePath) return annots.toString();
  const finalPathName =
    filePath + "\\" + fileName + "_" + strCurrentDatetime + ".xfdf";
  fs.writeFile(finalPathName, annots.toString(), (err) => {
    if (err) {
      console.log(err);
    }
    // else {}
  });
  return finalPathName;
}

function createFreeText(root, element, pageStyle) {
  // console.log(element);
  const { name, type, value, identifier, position, style } = element;
  const datetime = moment().format("YYYYMMDDHHmmss");
  // const elementStyle = pageStyle[type || "variable"];
  let colorRGB = hexToRGB(
    style["border-color"] || pageStyle.page["border-color"],
    true
  );
  const bgColor = style["background-color"];
  const fontFamily = style["font-family"] || pageStyle.page["font-family"];
  const fontSize = style["font-size"] || pageStyle[type]["font-size"];
  const rect = [
    position.x,
    position.y,
    position.x + position.width,
    position.y + position.height,
  ];
  let identifiers = [];

  Object.keys(identifier).forEach((key) => {
    identifiers.push(identifier[key]);
  });
  let xmlFreeText = root.ele("freetext");

  // xmlFreeText.att("color", bgColor);
  // xmlFreeText.att("creationdate", "D:" + datetime + "+08'00'");
  // xmlFreeText.att("flags", "print");
  xmlFreeText.att("color", bgColor);
  xmlFreeText.att("creationdate", "D:" + datetime + "+08'00'");
  xmlFreeText.att("date", "D:" + datetime + "+08'00'");

  xmlFreeText.att("name", identifiers.join(","));
  xmlFreeText.att("page", parseInt(identifier.page) - 1);
  xmlFreeText.att("rect", rect.join(","));
  xmlFreeText.att("subject", value);
  xmlFreeText.att("title", name);
  xmlFreeText.att("flags", "print");

  if (style["border-style"] == "dash") {
    xmlFreeText.att("style", "dash");
    xmlFreeText.att("dashes", "2,2");
  }

  let xmlRichText = xmlFreeText.ele("contents-richtext");
  let xmlBody = xmlRichText.ele("body");
  xmlBody.att("xmlns", "http://www.w3.org/1999/xhtml");
  xmlBody.att("xmlns:xfa", "http://www.xfa.org/schema/xfa-data/1.0/");
  xmlBody.att("xfa:APIVersion", "Acrobat:9.4.0");
  xmlBody.att("xfa:spec", "2.0.2");
  xmlBody.att(
    "style",
    "font: " +
      fontFamily +
      " " +
      fontSize.toString() +
      "pt; text-align:left; color:" +
      style.color +
      ";"
  );

  var xmlP = xmlBody.ele("p");
  xmlP.att("dir", "ltr");
  let xmlB = xmlP.ele("b");
  xmlB.txt(value);
  // console.log(colorRGB);
  xmlFreeText
    .ele("defaultappearance")
    .txt(colorRGB + " rg 0 Tc 0 Tw 100 Tz 0 TL 0 Ts 0 Tr /Helv 12 Tf");
}

function hexToRGB(h, isPct) {
  let r = 0,
    g = 0,
    b = 0;
  isPct = isPct === true;

  if (h.length == 4) {
    r = "0x" + h[1] + h[1];
    g = "0x" + h[2] + h[2];
    b = "0x" + h[3] + h[3];
  } else if (h.length == 7) {
    r = "0x" + h[1] + h[2];
    g = "0x" + h[3] + h[4];
    b = "0x" + h[5] + h[6];
  }

  if (isPct) {
    //   r = +(r / 255 * 100).toFixed(1);
    //   g = +(g / 255 * 100).toFixed(1);
    //   b = +(b / 255 * 100).toFixed(1);
    r = +(r / 255).toFixed(3);
    g = +(g / 255).toFixed(3);
    b = +(b / 255).toFixed(3);
  }

  return [r, g, b].join(" ");
}
module.exports = {
  buildXFDF,
};
