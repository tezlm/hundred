const https = require("https");
const stream = require("stream");

async function request(method, url, body, headers = {}) {
	return new Promise((resolve, reject) => {
		const req = https.request(url, { headers, method }, (res) => {
			let data = "";
			res.setEncoding("utf8");
			res.on("data", (d) => (data += d));
			res.on("end", () => resolve(data));
			res.on("error", reject);
		});
		if (body) {
			if (body instanceof stream.Readable) {
				body.pipe(req);
			} else {
				req.end(body);
			}
		}
	});
}

async function get(url, headers = {}) {
	return request("GET", url, null, headers);
}

async function post(url, body, headers = {}) {
	return request("POST", url, body, headers);
}

async function getJSON(url, headers = {}) {
	return JSON.parse(await get(url, headers));
}

async function postJSON(url, body, headers = {}) {
	return JSON.parse(await get(url, JSON.stringify(body), headers));
}

module.exports = { request, get, post, getJSON, postJSON };
