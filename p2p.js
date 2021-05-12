// by zestylemonade
const net = require("net");
const genId = () => Math.floor(Math.random() * (2 << 16));
const ipWrite = (addr, buf) => addr.split(".").forEach((i, x) => buf[x] = parseInt(i, 10));
const ipRead = (buf) => buf.reduce((a, i) => `${a}.${i.toString(10)}`, "").slice(1);

class Messenger extends net.Server {
	constructor() {
		super();
		this.conns = new Set(); // connections
		this.recieved = new Set(); // store msg ids to prevent duplicates
		this.on("connection", conn => {
			conn.on("data", data => this.handle(data, conn));
			conn.on("disconnect", () => this.conns.delete(conn));
			conn.write(Buffer.from([0x00]));
			this.conns.add(conn);
		});
	}

	// get some ips for redundant connections
	find() {
		const addrs =  [...this.conns.values()]
			.filter(i => i.address().family === "IPv4")
			.slice(-3)
			.map(i => i.address());
		const buf = Buffer.alloc(addrs.length * 6 + 2);
		buf[0] = 0x02;
		buf[1] = addrs.length;
		addrs.forEach((i, x) => {
			ipWrite(i.address, buf.slice(x * 6, x * 6 + 4));
			buf.writeUInt16BE(i.port, x * 6 + 4);
		});
		return buf;
	}

	// handle incoming data
	handle(data, conn) {
		switch(data[0]) {
			case 0x00: return this.emit("ping", conn); // pings
			case 0x01: conn.write(this.find()); // redundant ips request
			case 0x02: { // redundant conns
				for(let i = 0; i < data[1]; i++) {
					const ip = ipRead(data.slice(i * 6 + 2, i * 6 + 4));
					this.connect(`${ip}:${data.readUInt16BE(i * 6) + 4}`, false);
				}
				break;
			}
			case 0x03: { // messages
				const id = data.readUInt32BE(1);
				const channel = data.readUInt32BE(5);
				if(this.recieved.has(id)) return;
				this.emit("message", data.slice(9).toString(), channel, id, conn);
				this.recieved.add(id);
				this.broadcast(data, conn);
				setTimeout(() => this.recieved.delete(id), 10 * 1000);
				break;
			}
		}
	}

	// create a new connection
	connect(where, requestRedundant = true) {
		const conn = net.connect(where);
		conn.on("data", data => this.handle(data));
		conn.on("disconnect", () => this.conns.delete(conn));
		conn.write(Buffer.from([0x00]));
		if(requestRedundant) conn.write(Buffer.from([0x01]));
		this.conns.add(conn);
	}

	// send data to all peers
	broadcast(data, ignore) {
		this.conns.forEach((i) => i !== ignore && i.write(data));
	}

	// pack and broadcast a string or buffer
	send(channel, msg) {
		msg = Buffer.from(msg);
		const id = genId();
		const buf = Buffer.alloc(msg.length + 9);
		buf[0] = 0x03;
		buf.writeUInt32BE(id, 1);
		buf.writeUInt32BE(channel, 5);
		msg.copy(buf, 9);
		this.recieved.add(id);
		this.broadcast(buf);
	}
}

module.exports = Messenger;
