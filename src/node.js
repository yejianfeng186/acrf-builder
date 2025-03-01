const { Parser } = require("./state.js");
const { trimPrecision } = require("./util.js");
const pp = Parser.prototype;
class METARECORD {
  constructor(id, input) {
    this.id = id;
    this.value = input;
    this.domain;
    this.used = new Set();
  }
  getRaw() {
    return Object.assign({}, this.value);
  }
  getID() {
    if (!this.value) return this.id;
    if (this.value["ID"] !== undefined) return this.value["ID"];
    else return this.id;
  }
  getFormID() {
    if (!this.value) return;
    const id = this.value["CRFDS"];
    if (!id) return;
    return id;
  }
  getFormKey() {
    let name = this.getFormID();
    if (!name) return;
    return name.toLowerCase();
  }

  getPageNumber() {
    if (!this.value) return;
    if (!this.value["PAGENUMBER"]) return -1;
    else return Number(this.value["PAGENUMBER"]);
  }
  getPageKey() {
    let key = this.getPageNumber();
    return String(key);
  }
  getFieldID() {
    if (!this.value) return;
    if (this.value["CRFVAR"]) return this.value["CRFVAR"];
    else if (this.value["CDASHVAR"]) return this.value["CDASHVAR"];
    else return this.cur.pos;
  }
  getFieldKey() {
    let name = this.getFieldID();
    if (!name) return;
    return name.toLowerCase();
  }
  getFieldLabel() {
    if (!this.value) return;
    return this.value["CRFDES"];
  }
  getDomain() {
    if (!this.value) return [];
    if (!this.value["SDTMDOM"]) return [];
    if (typeof this.value["SDTMDOM"] === "string")
      return this.value["SDTMDOM"].split(",");
    else return this.value["SDTMDOM"];
  }
  getVariable() {
    if (!this.value) return [];
    if (!this.value["SDTMVAR"]) return [];
    if (typeof this.value["SDTMVAR"] === "string")
      return this.value["SDTMVAR"].split(",");
    else return this.value["SDTMVAR"];
  }
  getNote() {
    if (!this.value) return [];
    if (!this.value["NOTE"]) return [];
    if (typeof this.value["NOTE"] === "string")
      return this.value["NOTE"].split("\n");
    else return this.value["NOTE"];
  }
  getX() {
    if (!this.value || !this.value["X"]) return 0;
    return trimPrecision(Number(this.value["X"]));
  }
  getY() {
    if (!this.value || !this.value["Y"]) return 0;
    return trimPrecision(Number(this.value["Y"]));
  }
  getWidth() {
    if (!this.value || !this.value["WIDTH"]) return;
    return trimPrecision(Number(this.value["WIDTH"]));
  }
  getHeight() {
    if (!this.value || !this.value["HEIGHT"]) return;
    return trimPrecision(Number(this.value["HEIGHT"]));
  }
  isNotSubmit() {
    if (this.value["NOTSUB"]) return true;
    return false;
  }
  isNonCollect() {
    if (this.value["NONCOL"]) return true;
    return false;
  }
  // setDomain(domain) {
  //   this.domain = domain;
  // }
  setUsed(variable) {
    this.used.add(variable);
  }
  isUsed(variable) {
    return this.used.has(variable);
  }
}
class POSITION {
  constructor(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
  }
  setProperty(option) {
    const { x, y, width, height } = option;
    if (x != undefined) this.x = x;
    if (y != undefined) this.y = y;
    if (width != undefined) this.width = width;
    if (height != undefined) this.height = height;
  }
  extendHorizontal(n) {
    this.width += n;
  }

  extendVertical(n) {
    this.height += n;
  }
  startTop(n) {
    if (n == undefined) n = 0;
    return new POSITION(this.x, this.y + this.height + n);
  }
  startRight(n) {
    if (n == undefined) n = 0;
    return new POSITION(this.x + this.width + n, this.y);
  }
  moveTop(n) {
    if (n == undefined) n = 0;
    this.y += this.height + n;
  }
  moveBottom(n) {
    if (n == undefined) n = 0;
    this.y -= this.height - n;
  }
  moveLeft(n) {
    if (n == undefined) n = 0;
    this.x -= this.width - n;
  }
  moveRight(n) {
    if (n == undefined) n = 0;
    this.x += this.width + n;
  }
  // moveHorizontal(n) {
  //   return new POSITION(this.x + this.width + n, 0, this.height);
  // }
  // moverVertical(n) {
  //   return new POSITION(this.x, this.y - this.height - n, this.width, 0);
  // }
}
class FORM {
  constructor(input) {
    this.id = input.id;
    this.start = input.start;
    this.name;
    this.label;
    this.end = null;
    this.notsub = false;
    this.elements;
    this.header = {};
    this.page = {};
  }
  // copy(node) {
  //   Object.keys(node).forEach((key) => {
  //     this[key] = node[key];
  //   });
  // }
  // addDomain(name, label) {
  //   if (this.domain[name]) return;
  //   this.domain[name] = label;
  // }
}
class PAGE {
  constructor(input) {
    this.id = input.id;
    // this.start = input.start;
    // this.number;
    // this.end;
    this.header;
    this.notsub = false;
    this.noncol = false;
    this.field;
    this.position;
  }
}
class HEADER {
  constructor(input) {
    this.id = input.id;
    this.label;
    this.style;
    this.element;
  }
}
class FIELD {
  constructor(input) {
    this.id = input.id;
    this.start = input.start;
    this.label;
    // this.start;
    // this.end;
    // this.x;
    // this.y;
    // this.width;
    // this.height;
    this.notsub = false;
    this.noncol = false;
    this.record;
  }
}
class RECORD {
  constructor(id, raw) {
    this.id = id;
    this.raw = raw;
    this.domain;
    this.x;
    this.y;
    this.width;
    this.height;
    this.location;
    this.position;
  }
}
class DOMAIN {
  constructor(id) {
    this.id = id;
    this.label;
    this.style;
    this.variable;
    this.note;
  }
}
class VARIABLE {
  constructor(id) {
    this.id = id;
    this.label;
    this.dataset;
    this.style;
    this.note;
  }
}
class NOTE {
  constructor(raw) {
    this.raw = raw;
    this.variable;
  }
}
class ELEMENT {
  constructor() {
    this.name;
    this.value;
    this.identifier;
    this.position;
    this.style;
  }
}
// class HEADER {
//   constructor() {
//     this.text;
//     this.color;
//     this.bgColor;
//   }
// }
pp.isFormExist = function () {
  if (this.eof) return;
  let name = this.cur.getFormName();
  if (!name) return false;
  if (this.tree[name]) return true;
  else return false;
};

pp.getDomain = function () {
  let domains = this.cur["SDTMDOM"];
  if (!domains) return [];
  if (Array.isArray(domains)) {
    return domains;
  } else return domains.split(",");
};
pp.startForm = function () {
  const id = this.cur.getFormID();
  const start = this.cur.getPageNumber();
  let form = new FORM({ id, start });
  this.form = form;
  return form;
};
pp.finishForm = function () {
  const form = this.form;
  this.form = null;
  return form;
};
pp.startPage = function () {
  const id = this.cur.getPageNumber();
  let page = new PAGE({ id });
  // let position =
  // const height = this.cur.getHeight();
  const height = 18;
  page.position = new POSITION(
    this.getStyle().padding.left,
    this.option["page-size"]["height"] - height - 5,
    0,
    height
  );
  this.page = page;
  return page;
};
pp.finishPage = function () {
  const page = this.page;
  this.page = null;
  return page;
};

pp.startField = function () {
  const id = this.cur.getFieldID();
  let field = new FIELD({ id });
  this.field = field;
  return field;
};

pp.finishField = function () {
  const field = this.field;
  this.field = null;
  return field;
};

pp.startRecord = function () {
  const id = this.cur.getID();
  const height = this.cur.getHeight();
  let location = new POSITION(
    this.cur.getX(),
    this.cur.getY(),
    this.cur.getWidth(),
    height
  );

  let position = location.startRight(2);
  position.extendVertical(height);
  position.extendHorizontal(1);
  let record = new RECORD(id, this.cur.getRaw());
  position.y -= 2;
  record.location = location;
  record.position = position;

  this.record = record;
  return record;
};
pp.finishRecord = function () {
  const record = this.record;
  this.record = null;
  return record;
};
pp.startDomain = function (id) {
  // this.context.push({ type: "domain", id: name, x: 0, y: 0 });
  let domain = new DOMAIN(id);
  this.domain = domain;
  return domain;
};
pp.finishDomain = function () {
  const domain = this.domain;
  this.domain = null;
  return domain;
};
pp.startVariable = function (id) {
  let variable = new VARIABLE(id);
  this.variable = variable;
  return variable;
};
pp.finishVariable = function () {
  const variable = this.variable;
  this.variable = null;
  return variable;
};
pp.createPosition = function (obj) {
  if(!obj) return new POSITION();
  if (obj instanceof POSITION) return obj;
  let position = new POSITION();
  return position.setProperty(obj);
};
pp.startHeader = function (id) {
  return new HEADER({ id });
};

pp.startNote = function (value) {
  return new NOTE(value);
};
pp.startElement = function () {
  return new ELEMENT();
};

// pp.startPage = function () {
//   let id = this.cur.getPageNumber();
//   return new PAGE(id);
// };
// pp.finishPage = function (page) {
//   if (!page) return;
//   page.end = this.prev.id;
//   return page;
// };
// pp.startField = function () {
//   let id = this.cur.getRecordID();
//   page.end = this.prev.id;
//   return new FIELD(id);
// };
// pp.startElement = function () {
//   let id = this.cur.getID();
//   return new NODE(id);
// };
// pp.finishField = function (field) {
//   if (!field) return;
//   field.end = this.prev.getID();
//   return field;
// };
pp.getMetaRecord = function () {
  return new METARECORD(this.pos, this.target[this.pos]);
  // return new METARECORD(null, this.target[this.pos]);
};

module.exports = { DOMAIN };
