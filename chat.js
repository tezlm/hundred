// by zestylemonade
const net = require("net");
const port = process.env.PORT || 1234;
const clear = "\u001b[2K\u001b[0G";
const mvup = "\u001b[1A";
const accent = (msg) => `\u001b[36;1m${msg}\u001b[0m`;
const conns = [];
const send = (msg) => conns.forEach((i) => i.conn.write(msg));

function command(line, user) {
	const parts = line.slice(1).trimEnd().split(" ");
	switch (parts[0]) {
		case "people":
			if (conns.length === 1) return "you're the only one online!";
			return `${conns.length} people: ${conns.map(i => i.name || "anon").join(", ")}`;
		case "name":
			if (!parts[1]) return "you need a name";
			const name = parts.slice(1).join(" ");
			send(`${user.name} changed their name to ${name}`);
			return `name set to ${(user.name = name)}`;
		case "help":
			return "help, people, name";
		default:
			return "unknown command";
	}
}

net.createServer((conn) => {
	const user = { conn, rate: 0 };
	conn.setEncoding("utf8");
	conn.on("close", () => {
		conns.splice(conns.indexOf(user), 1);
		send(`${clear}${user.name} left\n=> `);
	});
	conn.on("data", (line) => {
		user.rate++;
		setTimeout(() => user.rate--, 1000 * 3);
		if(user.rate > 8) {
			conns.splice(conns.indexOf(user), 1);
			conn.end("do not spam\n");
			conn.destroy();
			return;
		}
		if (!user.name) {
			user.name = line.slice(0, -1);
			send(`${clear}${accent(user.name + " joined!")}\n=> `);
		} else if (line[0] === "/") {
			conn.write(`${clear}${mvup}${command(line, user)}\n=> `);
		} else {
			conn.write(mvup);
			send(`${clear}[${user.name}] ${line}=> `);
		}
	});
	conn.write("hello!\nname: ");
	conns.push(user);
}).listen(port, () => {
	console.log("listening on port ", port);
});
