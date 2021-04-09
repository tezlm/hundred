// by ZestyLemonade
const fs = require("fs");

function compile(template) {
	const parts = [];
	const reg = /{{.+?}}/g;
	let index = 0;
	while ((match = reg.exec(template)) !== null) {
		parts.push(["data", template.slice(index, match.index)]);
		parts.push(["fmt", match[0].slice(2, -2)]);
		index = reg.lastIndex;
	}
	parts.push(["data", template.slice(index)]);
	return parts.filter((i) => i);
}

class Templater {
	constructor() {
		this.templates = new Map();
	}

	add(file, name) {
		this.templates.set(name, compile(fs.readFileSync(file, "utf8")));
	}

	render(name, data, stream) {
		stream.writeHead(200, { "Content-Type": "text/html" });
		for (let part of this.templates.get(name)) {
			if (part[0] === "fmt") {
				stream.write(data[part[1]] || "");
			} else {
				stream.write(part[1]);
			}
		}
		stream.end();
	}
}

module.exports = Templater;
