// by zestylemonade
const isalpha = c => /[a-z]/i.test(c);
const isspace = c => /\s/.test(c);

class Node {
	constructor(type, parent) {
		this.type = type;
		this.parent = parent;
		this.children = [];
		if(parent) parent.children.push(this);
	}
}

function read(gen) {
	let buf = "";
	while(isalpha(gen.peek())) buf += gen.next();
	return buf;
}

function string(gen) {
	const raw = read(gen);
	if(raw) return raw;
	let buf = "";
	gen.next();
	while(!gen.done()) {
		if(gen.peek() === '"') break;
		if(gen.peek() === '\\') gen.next();
		buf += gen.next();
	}
	gen.next();
	return buf;
}

function generate(gen, parent) {
	let buf = "";
	while(!gen.done()) {
		if(gen.peek() === '<') {
			if(tag()) return;
		} else {
			buf += gen.next();
		}
	}

	function tag() {
		flush();
		gen.next();
		if(gen.peek() === '/') return true;
		
		const node = new Node("element", parent);
		node.name = read(gen);
		node.attrs = new Map();
		while(gen.next() !== '>') {
			if(gen.peek() == '/') {
				gen.next();
				gen.next();
				return false;
			}
			const key = read(gen);
			gen.next();
			const value = string(gen);
			node.attrs.set(key, value);
		}
		generate(gen, node);
		return false;
	}

	function flush() {
		if(!buf) return;
		const node = new Node("text", parent);
		node.data = buf;
		buf = "";
	}
}

function parse(xml) {
	let i = 0;
	const root = new Node("root", null);
	const gen = {
		next: () => xml[i++],
		peek: () => xml[i],
		done: () => i >= xml.length,
	};
	generate(gen, root);
	return root;
}

module.exports = parse;
