const pixelWidth = require("string-pixel-width");

const {
  copyAttr,
  parseSuppVariable,
  splitVariable,
  re,
  splitDomain,
} = require("./util");

class Parser {
  constructor(input, refer, option, style) {
    this.input = input;
    this.length = 0;
    this.prev;
    this.refer = refer || {};
    this.target;
    this.pos = 0;
    this.cur = {};
    this.eof = false;
    this.domain;
    this.variable;
    this.tree = {};
    this.option = option || null;
    this.style = style || null;
    this.header = {};
    this.context = [];
  }
  static parse(input, refer) {
    return new this(input, refer).parse();
  }
  static parseTarget(obj, refer) {
    let parser = new this(null, refer);
    if (Array.isArray(obj)) parser.target = obj;
    else parser.target = [obj];
    parser.init();
    return parser;
  }

  parse() {
    // let node = this.startNode();
    if (!this.input) return;
    this.target = this.input["MCRF"];
    this.init();
    return this.buildTopTree();
  }
  next() {
    this.prev = this.cur;
    if (this.pos >= this.length) {
      this.eof = true;
      return;
    }
    this.readMetaRecord();
  }
  buildTopTree() {
    this.tree["form"] = this.parseForm();
    // console.log(this.tree["form"]);
    // console.log(this.header);
    // console.log(this.context.length);
    return this.tree;
  }
  parseForm() {
    let forms = {};
    while (!this.eof) {
      let id = this.cur.getFormID();
      forms[id] = forms[id] || {};
      forms[id] = this.buildForm();
    }
    return forms;
  }
  buildForm() {
    let form = this.startNode("form");
    form["page"] = this.parsePages();

    return this.finishNode(form);
  }
  parsePages() {
    let pages = {};
    let form = this.cur.getFormID();
    while (!this.eof && this.cur.getFormID() == form) {
      let id = this.cur.getPageNumber();
      pages[id] = pages[id] || {};
      pages[id] = this.buildPage();
    }
    return pages;
  }
  buildPage() {
    let page = this.startNode("page");
    page["field"] = this.parseField();
    page["header"] = Object.assign({}, this.header);
    page["elements"] = Object.keys(this.header).map((key) => {
      let text = key;
      let domain = this.domain[key];
      if (domain) {
        text += "(" + domain.label + ")";
      }
      return this.buildElement(text, "domain");
    });
    this.header = {};
    return this.finishNode(page);
  }
  parseField() {
    let fields = {};
    let pageNumber = this.cur.getPageNumber();
    while (!this.eof && this.cur.getPageNumber() == pageNumber) {
      let id = this.cur.getFieldID();
      if (fields[id] === undefined) {
        fields[id] = this.buildField();
        const field = fields[id];
        const recordKeys = Object.keys(field.record);
        const raw = field.record[recordKeys[0]]?.raw;
        if (raw) {
          field.x = raw["X"];
          field.y = raw["Y"];
          field.width = raw["WIDTH"];
          field.height = raw["HEIGHT"];
        }
        // console.log(fields[id]);
      } else {
        this.appendField(fields[id], this.buildField());
      }
      // fields[id] = fields[id] || {};
      // fields[id] = this.buildField();
      // this.next();
    }
    return fields;
  }
  appendField(source, target) {
    if (!source || !target) return;
    source.end = target.end;
    source.record = Object.assign(source.record, target.record);
  }
  buildField() {
    let field = this.startNode("field");
    field["label"] = this.cur.getFieldLabel();
    field["record"] = this.parseRecord();
    return this.finishNode(field);
  }
  parseRecord() {
    let fieldRecords = {};
    let fieldID = this.cur.getFieldID();
    while (!this.eof && this.cur.getFieldID() == fieldID) {
      let id = this.cur.id;
      // if (!fieldRecords[id]) fieldRecords[id] = this.buildRecord();
      // else {
      //   console.log("1");
      // }
      fieldRecords[id] = fieldRecords[id] || {};
      fieldRecords[id] = this.buildRecord();
      this.next();
    }
    return fieldRecords;
  }
  buildRecord() {
    let record = this.startRecord();
    record["domain"] = this.parseDomain();
    return record;
  }
  parseDomain() {
    let recordDomains = {};
    let domains = this.cur.getDomain();
    for (let i = 0; i < domains.length; i++) {
      let domain = domains[i];
      this.cur.setDomain(domain);
      if (recordDomains[domain]) continue;
      recordDomains[domain] = this.buildDomain(domain);
    }
    return recordDomains;
  }
  buildDomain(name) {
    let domain = this.startDomain(name);

    if (this.domain[name]) {
      copyAttr(this.domain[name], domain, "variable");
    }
    domain["variable"] = this.parseVariable(name);
    if (Object.keys(domain["variable"]).length == 0)
      domain["note"] = this.parseNote();

    return this.finishDomain(domain);
  }
  parseVariable(domainName) {
    let domainVariables = {};
    let tempDomain = this.domain[domainName];
    // if (!tempDomain) tempDomain.startDomain();
    let variables = this.cur.getVariable();
    if (!variables) return;
    for (let i = 0; i < variables.length; i++) {
      let obj = parseSuppVariable(variables[i]);
      let separatedDomain = splitDomain(obj);
      let name = splitVariable(obj);
      // console.log(tempDomain);
      let tempVariable =
        tempDomain && tempDomain["variable"] && tempDomain["variable"][name];

      if (this.cur.isUsed(name)) continue;

      if (tempVariable === undefined && separatedDomain != domainName) continue;

      domainVariables[name] = this.buildVariable(tempVariable, name);
      if (obj && obj.dataset > 1) domainVariables[name].dataset = obj.dataset;
    }
    return domainVariables;
  }
  buildVariable(template, name) {
    let variable = this.startVariable(name);
    if (template) {
      copyAttr(template, variable, "note");
    }
    this.cur.setUsed(name);
    variable["note"] = this.parseNote();
    variable["element"] = this.buildElement(name, "variable");
    return variable;
  }
  parseNote() {
    let list = [];
    let notes = this.cur.getNote();

    for (let i = 0; i < notes.length; i++) {
      let note = this.startNote(notes[i]);
      this.parseCondition(note);
      list.push(note);
    }
    return list;
  }
  parseCondition(note) {
    re.reVariableLevel.lastIndex = 0;
    re.reValueLevel.lastIndex = 0;
    let condition = note.raw;
    let variableCondition = re.reVariableLevel.exec(condition) || [];
    let valueCondition = re.reValueLevel.exec(condition) || [];
    let inSuppCondition = re.reSuppLevel.exec(condition) || [];
    let noteVariable = new Set();
    // let submitValue;

    if (valueCondition.length > 0) {
      // console.log(valueCondition);
      valueCondition.forEach((value) => {
        if (value) {
          let arrVarVal = value.split(/\s*when\s*|\s*where\s*/gi);
          let i = 0;
          let item;
          while ((item = arrVarVal[i++])) {
            let variable = item.match(re.reVariable);
            if (variable) noteVariable.add(variable[0]);
          }
        }
      });
    } else if (variableCondition.length > 0) {
      variableCondition.forEach((value) => {
        if (value) {
          // console.log(value);
          let arrValue = value.split(/\s*=\s*/gi);

          let i = 0;
          let item;
          while ((item = arrValue[i++])) {
            let variable = item.match(re.reVariable);

            if (variable) noteVariable.add(variable[0]);
          }
        }
      });
    } else if (inSuppCondition.length) {
      inSuppCondition.forEach((value) => {
        if (value) {
          let arr = value.split(re.reInSupp);

          if (arr.length) noteVariable.add(arr[0]);
        }
      });
    }
    if (noteVariable.size) {
      let variables = {};
      noteVariable.forEach((ele) => {
        if (this.variable[ele]) variables[ele] = Array.from(this.variable[ele]);
        else variables[ele] = null;
      });
      note.variable = variables;
    }
  }
  buildElement(text, type) {
    let header = this.getHeader();
    let element = this.startElement();
    const styleTemplate = this.getStyle(type);
    let style = {};
    let width =
      pixelWidth(text, {
        font: styleTemplate["font-family"],
        size: styleTemplate["font-size"],
        bold: false,
      }) + 5;

    element["value"] = text;
    element["type"] = type;
    // style["color"] = header["color"];
    // style["background-color"] = header["background-color"];
    // element["bgColor"] = header["bgColor"];

    // element["bdStyle"] = style["border-style"];
    // element["bdColor"] = style["border-color"];
    // element["font"] = style["font-family"];
    // element["fontSize"] = style["font-size"];
    // element["color"] = header["color"];

    element["x"] = header[type]["x"];
    element["y"] = header[type]["y"];

    element["width"] = width;
    style = {
      color: header["color"],
      "background-color": header["background-color"],
    };

    if (this.cur.isNonCollect()) {
      style["bolder-style"] = "dash";
    }

    if (type == "variable") {
      element["height"] = this.cur.getHeight();
    } else {
      element["height"] = styleTemplate["font-size"] + 1;
    }

    header[type]["x"] += element["width"];
    // header[type]["y"] -= element["height"];
    element["form"] = this.cur.getFormID();
    element["page"] = this.cur.getPageNumber();
    element["field"] = this.cur.getFieldID();
    element["domain"] = this.cur.domain;
    element["style"] = style;

    return element;

  }
  getHeader() {
    let name;
    let context = this.getContext();
    let style = this.getStyle();
    if (context.type == "domain") name = context.id;
    let header = this.header[name];
    if (header) return header;

    let domain = {};
    let variable = {};
    let bgColors = style["bgColors"];
    let length = Object.keys(this.header).length;
    let bgColor = bgColors[length % bgColors.length];

    domain["x"] = style.padding.left;
    domain["y"] = this.option["page-size"]["height"] - 20;

    variable["x"] = this.cur.getX() + this.cur.getWidth();
    variable["y"] = this.cur.getY();

    header = this.startHeader();
    header["color"] = style["color"];
    header["background-color"] = bgColor;
    header["domain"] = domain;
    header["variable"] = variable;

    this.header[name] = header;
    return this.header[name];
  }
  getContext() {
    if (this.context.length == 0) return;
    return this.context[this.context.length - 1];
  }
  getStyle(type) {
    let style = this.style;
    if (!type) return style.page;

    if (type === "variable") {
      return Object.assign({}, style.page, style.domain, style.variable);
    } else if (type === "domain") {
      return Object.assign({}, style.page, style.domain);
    } else return this.style;
  }
  updateContext(key, value) {
    if (!key || !value) return;
    let context = this.getContext();
    context[key] = value;
  }
  // parseRecord() {
  //   let pageRecords = {};
  //   let pageNumber = this.cur.getPageNumber();
  //   while (!this.eof && this.cur.getPageNumber() == pageNumber) {
  //     let id = this.cur.getID();
  //     pageRecords[id] = pageRecords[id] || [];
  //     pageRecords[id].push(this.buildRecord());
  //     this.next();
  //   }
  //   return pageRecords;
  // }
  // buildRecord() {
  //   return Object.assign({}, this.cur);
  // }
  // buildDomain(node) {
  //   let domains = this.getDomain();
  //   for (let i = 0; i < domains.length; i++) {
  //     node.addDomain(domains[i], domains[i]);
  //   }
  // }
  readMetaRecord() {
    this.cur = this.getMetaRecord();
    this.pos++;
  }
}

module.exports = {
  Parser,
};
