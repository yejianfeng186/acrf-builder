const { Parser } = require("./state.js");
const { splitDomain, splitVariable, createPageStyle } = require("./util");

const pp = Parser.prototype;
pp.init = function () {
  this.initOption();
  this.initStyle();
  if (this.input && this.input["OPTION"]) this.option = this.input["OPTION"];
  this.initTemplate();
  // this.initDomain();

  this.length = this.target.length;
  this.readMetaRecord();
};
pp.initOption = function () {
  if (!this.option) {
    this.option = {
      lang: "en",
      "page-type": "letter",
    };
  }

  let size;
  if (this.option["page-type"] === "letter") {
    size = {
      width: 612,
      height: 792,
    };
  } else {
    size = {
      width: 595,
      height: 841,
    };
  }
  this.option["page-size"] = size;
};
pp.initStyle = function () {
  if (!this.style) this.style = createPageStyle(this.option["page-type"]);
};
pp.initTemplate = function () {
  let template = {};

  let domain = this.input && this.input["DOMAIN"];
  let lang = this.option.lang.toLowerCase();

  if (domain) {
    if (Array.isArray(domain)) {
      domain.forEach((item) => {
        const name = item["SDTMDOM"];
        const label = item["SDTMDOMLAB"];
        if (!name) return;
        const key = name.toLowerCase();
        let node = { id: name };
        if (typeof label === "object")
          node.label = (label && label[lang]) || "";
        else node.label = label;
        template[key] = node;
      });
    } else {
      template = domain;
    }
  }
  this.template = template;

  if (!this.refer) return;
  const metadata = this.refer["METADATA"];
  if (!metadata) return;
  let datasets = metadata["DatasetMetadata"];
  if (!datasets) return;
  for (let i = 0; i < datasets.length; i++) {
    const dataset = datasets[i];
    const name = dataset["ParentDomain"] || dataset["DomainCode"];
    const label = dataset["DatasetDescription"];
    if (!name) continue;
    const key = name.toLowerCase();
    if (template[key] !== undefined) continue;
    let node = { id: name };
    if (typeof label === "object")
      node.label = (label && label[this.lang]) || "";
    else node.label = label;
    template[key] = node;
  }
  const variables = metadata["VariableMetadata"];
  if (!variables) return;
  for (let j = 0; j < variables.length; j++) {
    const variable = variables[j];
    const name = variable["VariableName"];
    if(!name) continue;
    const datasetName = variable["ParentDomain"] || variable["DatasetName"];
    let domainName = splitDomain(datasetName);
    if (!domainName) domainName = datasetName.substr(0, 2);
    let domain = template[domainName.toLowerCase()];
    if (!domain) continue;

    
    let label = variable["VariableLabel"];
    const key = name.toLowerCase();
    let node = { id: name };
    if (typeof label === "object")
      node.label = (label && label[this.lang]) || "";
    else node.label = label;
    if (datasetName != domainName) node.dataset = datasetName;
    domain["variable"] = domain["variable"] || {};
    domain["variable"][key] = node;
  }
};
pp.initDomain = function () {
  let domain = {};
  let template = this.input && this.input["DOMAIN"];
  let lang = this.option.lang.toLowerCase();

  if (template) {
    if (Array.isArray(template)) {
      template.forEach((item) => {
        let name = item["SDTMDOM"];
        let label = item["SDTMDOMLAB"];
        if (domain[name]) return;
        let node = this.startDomain(name);
        if (typeof label === "object")
          node.label = (label && label[lang]) || "";
        else node.label = label;
        domain[name] = this.finishDomain(node);
      });
    } else {
      domain = template;
    }
  } else {
    if (!this.refer) return;
    let metadata = this.refer["METADATA"];
    if (!metadata) return;
    let datasets = metadata["DatasetMetadata"];
    if (!datasets) return;

    datasets.forEach((item) => {
      let name = item["ParentDomain"] || item["DomainCode"];
      let label = item["DatasetDescription"];

      let node = this.startDomain(name);
      if (typeof label === "object")
        node.label = (label && label[this.lang]) || "";
      else node.label = label;

      domain[name] = this.finishDomain(node);
    });
  }
  this.domain = domain;
  this.initVariable();
};
pp.initVariable = function () {
  if (!this.refer) return;
  let metadata = this.refer["METADATA"];
  if (!metadata) return;
  let variables = metadata["VariableMetadata"];
  if (!variables) return;
  let objVariable = {};
  for (let i = 0; i < variables.length; i++) {
    let element = variables[i];
    let datasetName = element["ParentDomain"] || element["DatasetName"];
    let domainName = splitDomain(datasetName);
    let domain = this.domain[domainName];
    if (!domain) continue;

    let name = splitVariable(element["VariableName"]);
    let label = element["VariableLabel"];
    let node = this.startVariable(name);
    objVariable[name] = objVariable[name] || new Set();
    objVariable[name].add(domainName);

    if (typeof label === "object")
      node.label = (label && label[this.lang]) || "";
    else node.label = label;
    if (datasetName != domainName) node.dataset = datasetName;

    domain["variable"] = domain["variable"] || {};
    domain["variable"][name] = node;
  }
  this.variable = objVariable;
};
