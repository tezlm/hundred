if(!process.argv[2]) throw "no file";
const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: "=> ",
});

const commands = {
	p(data) { throw data },
	c(data) { throw data.length },
	r(data, args) {
		if(arr("s", data, args)) return data;
		if(args.length < 2) throw "too few args";
		return data.replace(new RegExp(args[0], args[2] || ""), args[1]);
	},
	m(data, args) {
		if(arr("m", data, args)) return data;
		if(args.length < 1) throw "too few args";
		return data.match(new RegExp(args[0], args[1] || "")) || [];
	},
	d(data, args) {
		if(arr("d", data, args)) return data;
		if(args.length < 1) throw "too few args";
		return data.replace(new RegExp(args[0], "g"), "");
	},
	t(data, args) {
		if(arr("t", data, args)) return data;
		switch(args[0] || "all") {
			case "all": return data.trim();
			case "start": return data.trimStart();
			case "end": return data.trimEnd();
			default: throw "unknown trim";
		}
	},
	f(data, args) {
		if(!(data instanceof Array)) throw "cant";
		if(args.length < 1) throw "too few args";
		const reg = new RegExp(args[0], args[1] || "");
		return data.filter(i => reg.test(i));
	},
	w(data, args) {
		if(data instanceof Array) throw "cant";
		fs.writeFileSync(process.argv[2], data);
		throw `wrote ${data.length} bytes`;
	},
	s(data, args) {
		if(data instanceof Array) throw "cant";
		return data.split(args);
	},
	j(data, args) {
		if(!(data instanceof Array)) throw "cant";
		return data.join(args);
	},
};

function special(char) {
	switch(char) {
		case "n": return "\n";
		case "r": return "\r";
		case "t": return "\t";
		default: return char;
	}
}

function split(line) {
	const parts = [""];
	for(let i = 0; i < line.length; i++) {
		switch(line[i]) {
			case "\\": parts[parts.length - 1] += special(line[++i]); break;
			case "/": parts.push(""); break;
			default: parts[parts.length - 1] += line[i]; break;
		}
	}
	return parts.filter(i => i);
}

function arr(func, data, args) {
	if(data instanceof Array) {
		for(let i = 0; i < data.length; i++) data[i] = commands[func](data[i], args);
		return true;
	}
}

let data = fs.readFileSync(process.argv[2], "utf8");
console.log(`read ${data.length} bytes`);
rl.prompt();
rl.on("line", (line) => {
	const parts = split(line);
	if(!commands.hasOwnProperty(parts[0])) {
		return console.log("command does not exist"), rl.prompt();
	}
	try {
		data = commands[parts[0]](data, parts.slice(1));
		if(data instanceof Array) data = data.flat();
	} catch (err) { console.log(err) }
	rl.prompt();
});
