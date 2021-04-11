// by ZestyLemonade (with a few ideas from skybldev)
const http = require("http");
const fs = require("fs");
const path = require("path");
const normal = (...p) => path.resolve(path.join(...p));

function prepare(route) {
	const parts = [""];
	for (let i of route) {
		switch(i) {
			case ":": 
			case "/": parts.push(i); break;
			case "*": parts.push(i, ""); break;
			default: parts[parts.length - 1] += i; break;
		}
	}
	return parts.filter((i) => i);
}

function parse(route, url) {
	const data = { path: [] };
	for (let i of route) {
		if (i === "*") {
			let index = url.indexOf("/");
			index = index < 0 ? url.length : index;
			data.path.push(url.slice(0, index));
			url = url.slice(index);
		} else if (i[0] === ":") {
			pos = url.match(/[^/:]+/i)
			if(!pos) return null;
			data[i.slice(1)] = pos[0]
			url.slice(0, pos[0].length);
		} else if (url.slice(0, i.length) === i) {
			url = url.slice(i.length);
		} else return null; 
	}
	return data;
}

class Server extends http.Server {
	constructor() {
		super();
		this.on("request", this.handle);
		this.handlers = [];
		this.map = new Map();
	}

	handle(req, res) {
		const method = req.method.toUpperCase();
		const url = normal("/", req.url);
		if (this.map.has(url)) {
			const file = this.map.get(url);
			res.writeHead(200, file.type ? { "Content-Type": file.type } : {})
			return res.end(file.data);
		}
		for (let handler of this.handlers) {
			if (handler.method !== method) continue;
			const parsed = parse(handler.route, url);
			if (parsed) return handler.call(req, res, parsed);
		}
	}

	static(file, route) {
		const css = "<style>body{font-family:monospace;padding:1em;}</style>";
		const link = (i) => `<a href="${normal(route, i)}">${i}</a><br />`;
		const dir = files => ({ data: css + files.map(link).join("\n"), type: "text/html" });
		if (!fs.existsSync(file)) throw "file doesn't exist!";
		if (fs.lstatSync(file).isDirectory()) {
			const files = fs.readdirSync(file);
			for (let i of files) this.static(normal(file, i), normal("/", route, i));
			this.map.set(normal("/", route), dir(files));
		} else {
			const type = Server.types[path.extname(file).slice(1)];
			this.map.set(normal("/", route), { data: fs.readFileSync(file, "utf8"), type });
		}
		return this;
	}

	route(method, route, call) {
		route = prepare(normal("/", route));
		this.handlers.push({ method: method.toUpperCase(), route, call });
		return this;
	}

	get(route, call) { return this.route("GET", route, call) }
	post(route, call) { return this.route("POST", route, call) }

	static types = {
		html: "text/html",
		css: "text/css",
		js: "text/javascript",
		json: "application/json",
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
	};
}

module.exports = Server;
