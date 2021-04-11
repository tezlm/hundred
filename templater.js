// by ZestyLemonade
const fs = require("fs");
const path = require("path");

function compile(template) {
	const parts = [];
	const reg = /{{.+?}}/g;
	let index = 0;
	while ((match = reg.exec(template)) !== null) {
		const slice = match[0].slice(2, -2)
		parts.push(["data", template.slice(index, match.index)]);
		if(slice[0] === "#") {
			parts.push(["func", slice.slice(1).split(" ")]);
		} else {
			parts.push(["fmt", slice]);
		}
		index = reg.lastIndex;
	}
	parts.push(["data", template.slice(index)]);
	return parts.filter((i) => i);
}

function write(res, data) {
	if(typeof data === "function") return data(res, false);
	if(!data) return;
	return res.write(data.toString());
}

function render(template, data, res) {
	let shouldWrite = [true];
	for (let part of template) {
		if(part[0] === "func") {
			switch(part[1][0]) {
				case "if": shouldWrite.unshift(data[part[1][1]]); break;
				case "unless": shouldWrite.unshift(!data[part[1][1]]); break;
				case "end": shouldWrite.shift(); break;
			}
			continue;
		}
		if(!shouldWrite[0]) continue;
		if(part[0] === "fmt") {
			write(res, data[part[1]]);
		} else {
			res.write(part[1]);
		}
	}
}

class Templater {
	constructor() {
		this.templates = new Map();
	}

	add(file, name) {
		if(!name) name = path.parse(file).name;
		this.templates.set(name, compile(fs.readFileSync(file, "utf8")));
	}

	render(name, data) {
		return (res, main = true) => {
			if(main) res.writeHead(200, { "Content-Type": "text/html" });
			render(this.templates.get(name), data, res);
			if(main) res.end();
		}
	}
}

module.exports = Templater;
