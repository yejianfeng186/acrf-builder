const pixelWidth = require("string-pixel-width");

const {
  copyAttr,
  parseSuppVariable,
  splitVariable,
  re,
  trimPrecision,
  calcArea,
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
    this.template;
    this.form;
    this.page;
    this.field;
    this.record;
    this.domain;
    this.variable;
    this.tree = {};
    this.option = option || null;
    this.style = style || null;
    // this.header = {};
    // this.context = [];
    this.offset = { top: -2.5, left: 0 };
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
    this.target = this.input["MCRF"] || this.input;
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
      let key = this.cur.getFormKey();
      forms[key] = forms[key] || {};
      forms[key] = this.buildForm();
    }
    return forms;
  }
  buildForm() {
    // let form = this.startNode("form");
    let form = this.startForm();
    form["page"] = this.parsePages();
    return this.finishForm();
    // return this.finishNode(form, "form");
  }
  parsePages() {
    let pages = {};
    let form = this.cur.getFormID();
    while (!this.eof && this.cur.getFormID() == form) {
      let key = this.cur.getPageKey();
      if (!key) continue;
      pages[key] = pages[key] || {};
      pages[key] = this.buildPage();
    }
    return pages;
  }
  buildPage() {
    // let page = this.startNode("page");
    let page = this.startPage();
    page["field"] = this.parseField();
    // page["header"] = this.parseHeader();
    // calcArea(page.header);
    // console.log(calcArea(page.header));
    if (page.header) page.position.setProperty(calcArea(page.header));
    return this.finishPage();
  }
  parseHeader() {
    if (!this.page.header) this.page.header = {};
    let headers = this.page.header;
    let id = this.domain.id.toLowerCase();
    if (headers[id]) return;

    // header["style"] = {
    //   color: style["color"],
    //   "background-color": bgColor,
    // };
    headers[id] = this.buildHeader();
  }
  buildHeader() {
    const domain = this.domain;
    let name = domain.id;
    let label = name;
    let header = this.startHeader(name);
    let style = this.getStyle();
    let bgColors = style["bgColors"];
    let length = Object.keys(this.page.header).length;
    let bgColor = bgColors[length % bgColors.length];
    if (domain.label) {
      label += "(" + domain.label + ")";
    }
    header["style"] = {
      color: style["color"],
      "background-color": bgColor,
    };
    header["element"] = this.buildElement({
      text: label,
      type: "domain",
      style: header["style"],
    });
    return header;
  }
  parseField() {
    let fields = {};
    let pageNumber = this.cur.getPageNumber();
    while (!this.eof && this.cur.getPageNumber() == pageNumber) {
      const key = this.cur.getFieldKey();
      if (fields[key] === undefined) {
        fields[key] = this.buildField();
      } else {
        this.appendField(fields[key], this.buildField());
      }
    }
    return fields;
  }
  appendField(source, target) {
    if (!source || !target) return;
    // source.end = target.end;
    source.record = Object.assign(source.record, target.record);
  }
  buildField() {
    // let field = this.startNode("field");
    let field = this.startField();
    field["label"] = this.cur.getFieldLabel();
    field["record"] = this.parseRecord();
    return this.finishField();

    // return this.finishNode(field, "field");
  }
  parseRecord() {
    let fieldRecords = {};
    let fieldID = this.cur.getFieldID();
    while (!this.eof && this.cur.getFieldID() == fieldID) {
      let id = this.cur.getID();

      if (fieldRecords[id] === undefined) {
        fieldRecords[id] = fieldRecords[id] || {};
        fieldRecords[id] = this.buildRecord();
      } else {
        this.appendRecord(
          fieldRecords[id],
          this.buildRecord(fieldRecords[id].position)
        );
      }
      this.next();
    }
    return fieldRecords;
  }
  appendRecord(source, target) {
    if (!source || !target) return;
    if (!target.domain) return;
    source.domain = Object.assign(source.domain, target.domain);
    delete source.raw["SDTMDOM"];
    delete source.raw["SDTMVAR"];
  }
  buildRecord(position) {
    let record = this.startRecord();
    record["domain"] = this.parseDomain();
    if (position) record.position = position;
    if (record.header) record.position.setProperty(calcArea(record.header));
    return this.finishRecord();
  }
  parseDomain() {
    let recordDomains;
    let domains = this.cur.getDomain();

    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      const key = domain.toLowerCase();
      // this.cur.setDomain(domain);
      recordDomains = recordDomains || {};
      if (recordDomains[key]) continue;

      recordDomains[key] = this.buildDomain(domain);
    }
    return recordDomains;
  }
  buildDomain(name) {
    if (!name) name = this.cur.getDomain()[0];
    let domain = this.startDomain(name);
    const key = name.toLowerCase();
    if (this.template[key]) {
      copyAttr(this.template[key], domain, "variable");
    }
    // this.page.header = 1;
    this.parseHeader();
    domain["variable"] = this.parseVariable(key);

    // if (Object.keys(domain["variable"]).length == 0 && this.cur.getNote())
    //   domain["note"] = this.parseNote();

    return this.finishDomain();
  }
  parseVariable(domainKey) {
    let domainVariables = {};
    let tempDomain = this.template[domainKey];
    let variables = this.cur.getVariable();

    if (!variables) return;

    for (let i = 0; i < variables.length; i++) {
      let obj = parseSuppVariable(variables[i]);
      // let separatedDomain = splitDomain(obj);
      let name = splitVariable(obj);
      const key = name.toLowerCase();
      // console.log(tempDomain);
      let tempVariable =
        tempDomain && tempDomain["variable"] && tempDomain["variable"][key];

      // if (this.cur.isUsed(name)) continue;
      if (obj && obj.dataset > 1) domainVariables[key].dataset = obj.dataset;
      domainVariables[key] = this.buildVariable(name, tempVariable);
    }
    return domainVariables;
  }
  buildVariable(name, template) {
    let variable = this.startVariable(name);
    if (template) {
      copyAttr(template, variable, "note");
    }
    // this.cur.setUsed(name);
    variable["note"] = this.parseNote();
    variable["element"] = this.buildElement({ text: name, type: "variable" });
    return this.finishVariable();
  }
  parseNote() {
    let list = [];
    let notes = this.cur.getNote();

    for (let i = 0; i < notes.length; i++) {
      let note = this.startNote(notes[i]);
      this.parseCondition(note);
      // if (note.raw)
      //   note["element"] = this.buildElement({ text: note.raw, type: "note" });
      list.push(note);
    }
    if (list.length == 0) return;
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
  buildElement(option) {
    let { text, type, style } = option;
    let position;

    if (type == "domain") position = this.page.position;
    else position = this.record.position;
    if (!position) {
      console.log(1);
    }
    position = this.createPosition(position);

    if (!style) style = this.page.header[this.domain.id.toLowerCase()].style;

    const styleTemplate = this.getStyle(type);

    let element = this.startElement();

    let width = pixelWidth(text + " ", {
      font: styleTemplate["font-family"],
      size: styleTemplate["font-size"],
      bold: false,
    });

    element["value"] = text;
    element["type"] = type;
    width *= 1.08;
    let location = position.startRight(2);
    location.extendHorizontal(trimPrecision(width));
    location.extendVertical(trimPrecision(position.height));
    element["position"] = location;

    position.extendHorizontal(trimPrecision(width));
    // position.width += width;

    if (this.cur.isNonCollect()) {
      style["bolder-style"] = "dash";
    }
    let identifier = {};
    identifier["form"] = this.form?.id?.toLowerCase();
    identifier["page"] = this.page?.id;
    identifier["field"] = this.field?.id?.toLowerCase();
    identifier["record"] = this.record?.id;
    identifier["domain"] = this.domain?.id?.toLowerCase();
    // console.log(this.variable && this.variable.id);
    identifier["variable"] = this.variable?.id?.toLowerCase();

    element.identifier = identifier;
    element["style"] = style;

    return element;
  }

  // getContext() {
  //   if (this.context.length == 0) return;
  //   return this.context[this.context.length - 1];
  // }
  getStyle(type) {
    let style = this.style;
    if (!type) return style.page;

    if (type === "variable") {
      return Object.assign({}, style.page, style.domain, style.variable);
    } else if (type === "domain") {
      return Object.assign({}, style.page, style.domain);
    } else if (type == "note")
      return Object.assign({}, style.page, style.domain, style.variable);
    else return this.style;
  }
  readMetaRecord() {
    this.cur = this.getMetaRecord();
    this.pos++;
  }
  updateTree(tree) {
    this.tree = tree;
    if (!this.target.length) return;
    this.target.forEach(() => {
      this.updateNode();
      this.next();
    });
    return this.tree;
  }
  updateNode() {
    if (!this.cur) return;
    this.form = null;
    this.page = null;
    this.field = null;
    this.record = null;
    this.domain = null;
    this.variable = null;
    const record = this.cur.getRaw();
    const nodePatch = [
      { name: "form", value: "CRFDS", parse: "parseForm", build: "buildForm" },
      {
        name: "page",
        value: "PAGENUMBER",
        parse: "parsePage",
        build: "buildForm",
      },
      {
        name: "field",
        value: "CRFVAR",
        parse: "parseField",
        build: "buildField",
      },
      {
        name: "record",
        value: "ID",
        parse: "parseRecord",
        build: "buildRecord",
      },
      {
        name: "domain",
        value: "SDTMDOM",
        parse: "parseDomain",
        build: "buildDomain",
      },
      {
        name: "variable",
        value: "SDTMVAR",
        parse: "parseVariable",
        build: "buildVariable",
      },
    ];
    let obj = this.tree;

    for (let i = 0; i < nodePatch.length; i++) {
      let node = nodePatch[i];
      const key = node.name;
      const value = record[node.value];
      if (!obj[key]) {
        obj[key] = this[node.parse]();
        break;
      }
      let point = obj[key][String(value).toLowerCase()];

      if (!point) {
        obj[key][String(value).toLowerCase()] = this[node.build]();
        break;
      }
      this[key] = point;
      obj = point;
      console.log(key);
    }
  }
  updateNode2() {
    if (!this.cur) return;
    const record = this.cur.getRaw();
    const nodePatch = [
      { name: "form", value: "CRFDS" },
      { name: "page", value: "PAGENUMBER" },
      { name: "field", value: "CRFVAR" },
      {
        name: "record",
        value: "ID",
        parse: "parseRecord",
        build: "buildRecord",
      },
      {
        name: "domain",
        value: "SDTMDOM",
        parse: "parseDomain",
        build: "buildDomain",
      },
      {
        name: "variable",
        value: "SDTMVAR",
        parse: "parseVariable",
        build: "buildVariable",
      },
    ];
    let obj = this.tree;

    for (let i = 0; i < nodePatch.length; i++) {
      const node = nodePatch[i];
      // const preNode = i > 0 ? node : nodePatch[i - 1];
      const key = node.name;
      const funcParse = node.parse;
      // console.log(key);

      if (!obj[key]) {
        obj[key] = this[funcParse]();
        break;
      }

      // else if (Object.keys(obj[key]).length == 0) {
      //   obj[key] = this[funcParse]();
      //   break;
      // }
      // console.log(Object.keys(obj[key]).length);
      const value = record[node.value];
      console.log(value);
      if (!value) break;
      const name = String(value).toLowerCase();
      let point = obj[key][name];
      if (key === "domain")
        this.context.push({ type: "domain", id: name, x: 0, y: 0 });
      if (!point) {
        const funcBuild = node.build;

        obj[key][name] = this[funcBuild](value);

        break;
      }
      obj = point;
      this.context = [];
    }
    console.log(JSON.stringify(obj));
  }
}

module.exports = {
  Parser,
};
