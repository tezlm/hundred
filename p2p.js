// by zestylemonade
const net = require("net");
const genId = () => Math.floor(Math.random() * (2 << 16));

class Messenger extends net.Server {
	constructor() {
		super();
		this.conns = new Set(); // connections
		this.recieved = new Set(); // store msg ids to prevent duplicates
		this.on("connection", conn => {
			conn.on("data", data => this.handle(data, conn));
			conn.on("disconnect", () => this.conns.delete(conn));
			conn.write(this.find());
			this.conns.add(conn);
		});
	}

	// get some ips for redundant connections
	find() {
		const addrs =  [...this.conns.values()]
			.filter(i => i.address().family === "IPv4")
			.slice(-3)
			.map(i => {
				const addr = i.address();
				const buf = Buffer.alloc(6);
				addr.address.split(".").forEach((i, x) => (buf[x] = i));
				buf.writeUInt16BE(addr.port, 4);
				return buf;
		});
		const buf = Buffer.alloc(addrs.length * 6 + 2);
		buf[0] = 0x01;
		buf[1] = addrs.length;
		addrs.forEach((i, x) => i.copy(buf, 2 + 6 * x));
		return buf;
	}

	// handle incoming data
	handle(data, conn) {
		switch(data[0]) {
			case 0x00: return this.emit("ping", conn); // pings
			case 0x01: { // redundant conns
				const int = (off, i) => data[2 + off + i * 6].toString();
				for(let i = 0; i < data[1]; i++) {
					const ip = `${int(0, i)}.${int(1, i)}.${int(2, i)}.${int(3, i)}`;
					this.connect(`${ip}:${data.readUInt16BE(6 + i * 6)}`)
				}
				break;
			}
			case 0x02: { // messages
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
	connect(where) {
		const conn = net.connect(where);
		conn.on("data", data => this.handle(data));
		conn.on("disconnect", () => this.conns.delete(conn));
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
		buf[0] = 0x02;
		buf.writeUInt32BE(id, 1);
		buf.writeUInt32BE(channel, 5);
		msg.copy(buf, 9);
		this.recieved.add(id);
		this.broadcast(buf);
	}
}

module.exports = Messenger;
