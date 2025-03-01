let reVariable = /(?:\w{2,8})/i;
let reSupp = /^(SQ|SUPP)/i;
let reSplit = new RegExp(/\s*[/=\\]\s*/i);
let reInSupp = /\s+in\s+/;
let reVariableLevel = /(?:\w{2,8}\s*\/\s*)*\s*\w{2,8}\s*=(?:\s*\w{1,})+?/gi;
let reValueLevel =
  /(?:\w{2,8}\s*[/=\\\s]\s*)*\s*\w{2,8}\s*(when|where)(?:\s*\w{1,})+?/gi;
let reSuppLevel = /(?:\w{2,8}\s*[/=\\\s]\s*)*\s*\w{2,8}\s*in(?:\s*\w{2,})+?/gi;
function trimPrecision(value, precision) {
  if (!value || precision === 0) return;
  if (precision === undefined) precision = 1000;

  return Math.ceil(value * precision) / precision;
}
function copyAttr(source, target, ignore) {
  if (!source || !target) return;

  let keys = Object.keys(source);
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    if (ignore) {
      if (typeof ignore == "string" && key == ignore) continue;
      else if (typeof ignore == "object" && ignore.indexOf(key) > -1) continue;
    }
    target[key] = source[key];
  }
  return target;
}

function parseSuppVariable(source) {
  if (!source) return;
  let arr = source.split(/\s+in\s+/);
  if (arr.length == 0) return;
  if (!arr[1]) {
    if (reSupp.test(arr[0])) return { dataset: arr[0] };
    else return { variable: arr[0] };
  }
  return {
    dataset: arr[1].replace("s", ""),
    variable: arr[0].replace("s", ""),
  };
}
function splitDomain(source) {
  if (!source) return;
  let dataset;
  let variable;
  let obj;
  if (typeof source == "object") {
    if (source.dataset) dataset = source.dataset;
    if (source.variable) variable = source.variable;
  } else {
    obj = parseSuppVariable(source);
    dataset = obj.dataset;
    variable = obj.variable;
  }

  if (dataset) return dataset.replace(reSupp, "");
  if (!variable) return;
  if (reVariable.test(variable)) return variable.substr(0, 2);
}
function splitVariable(source) {
  if (!source) return;
  let variable;
  let obj;
  if (typeof source == "object") {
    if (source.variable) variable = source.variable;
  } else {
    obj = parseSuppVariable(source);
    variable = obj.variable;
  }
  if (!variable) return;
  if (reVariable.test(variable)) return variable.replace(" ", "");
}
function createPageStyle(pageType) {
  if (!pageType) pageType = "letter";
  let style = {
    page: {
      color: "#FF0000",
      "font-family": "Arial",
      "border-style": "dot",
      "border-color": "#000000",
      bgColors: [
        "#BFFFFF",
        "#FFFF96",
        "#96FF96",
        "#FFBE9B",
        "#FF80AB",
        "#FF8A80",
        "#B388FF",
        "#80D8FF",
        "#B9F6CA",
        "#FFFF8D",
      ],
    },
    domain: {
      "font-size": 14,
    },
    variable: {
      "font-size": 12,
    },
    note: {
      "font-size": 12,
    },
    noncol: {
      "border-style": "dash",
    },
  };

  let padding;
  if (pageType === "letter") {
    padding = {
      top: 34,
      left: 70,
      bottom: 60,
      right: 52,
    };
  } else {
    padding = {
      top: 113,
      left: 63,
      bottom: 30,
      right: 42,
    };
  }

  style.page["padding"] = padding;
  return style;
}

function getElement(tree, pageType) {
  if (!tree) return [];
  let elements = [];
  function traveler(node) {
    if (!node) return;
    if (typeof node == "string") return;
    else if (Array.isArray(node)) {
      node.forEach((item) => {
        traveler(item);
      });
    } else if (typeof node === "object") {
      // console.log(node);
      Object.keys(node).forEach((key) => {
        if (key === "element") elements.push(node[key]);
        else if (key === "elements") elements.push(...node[key]);
        // else if(key==="element") element.append(node[key]);
        else traveler(node[key]);
      });
    }
  }
  traveler(tree);
  return {
    style: createPageStyle(pageType),
    elements: elements,
  };
}
function calcArea(obj) {
  const target = getElement(obj);
  if (!target.elements) return;

  let x0 = 0,
    x1 = 0,
    y0 = 0,
    y1 = 0;

  target.elements.forEach((ele) => {
    let position = ele.position;
    if (x0 == 0 && y0 == 0) {
      x0 = position.x;
      y0 = position.y;
    }
    let x = position.x + position.width;
    let y = position.y + position.height;
    if (position.x < x0) x0 = position.x;
    if (position.y < y0) y0 = position.y;

    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  });
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  // console.log("************");
  // console.log(x0);
  // console.log(x1);
  // console.log(y0);
  // console.log(y1);
}
let re = {
  reVariable,
  reSupp,
  reSplit,
  reInSupp,
  reVariableLevel,
  reValueLevel,
  reSuppLevel,
};
module.exports = {
  copyAttr,
  parseSuppVariable,
  splitDomain,
  splitVariable,
  getElement,
  createPageStyle,
  trimPrecision,
  re,
  calcArea,
};
