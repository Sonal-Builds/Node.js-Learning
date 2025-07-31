Step 1: Create a Basic HTTP Server

// server.js
const http = require('http');
const PORT = 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello from Node.js server!' }));
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});


Step 2: Handle Routes

const http = require('http');
const PORT = 3000;

const server = http.createServer((req, res) => {
    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Welcome to API Home!' }));
    } 
    else if (req.url === '/about' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'About Page' }));
    } 
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));


Step 3: Parse Query Params

const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true); // true → query as object
    if (parsedUrl.pathname === '/greet' && req.method === 'GET') {
        const name = parsedUrl.query.name || 'Guest';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Hello, ${name}!` }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

Step 4: Handle POST Requests (Read Body)

const server = http.createServer((req, res) => {
    if (req.url === '/data' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const parsed = JSON.parse(body);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: parsed }));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

Test with Postman or curl:

curl -X POST -H "Content-Type: application/json" -d '{"name": "Arun"}' http://localhost:3000/data

const http = require('http');
const url = require('url');

let tasks = []; // In-memory data
const PORT = 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const id = parsedUrl.pathname.split('/')[2]; // extract id for /tasks/:id

    // Helper: Send JSON response
    const sendResponse = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // GET /tasks
    if (parsedUrl.pathname === '/tasks' && req.method === 'GET') {
        return sendResponse(200, tasks);
    }

    // GET /tasks/:id
    if (parsedUrl.pathname.startsWith('/tasks/') && req.method === 'GET') {
        const task = tasks.find(t => t.id == id);
        return task ? sendResponse(200, task) : sendResponse(404, { error: 'Task not found' });
    }

    // POST /tasks
    if (parsedUrl.pathname === '/tasks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const newTask = JSON.parse(body);
            newTask.id = tasks.length + 1;
            tasks.push(newTask);
            sendResponse(201, newTask);
        });
        return;
    }

    // PUT /tasks/:id
    if (parsedUrl.pathname.startsWith('/tasks/') && req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const updatedData = JSON.parse(body);
            const index = tasks.findIndex(t => t.id == id);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...updatedData };
                sendResponse(200, tasks[index]);
            } else {
                sendResponse(404, { error: 'Task not found' });
            }
        });
        return;
    }

    // DELETE /tasks/:id
    if (parsedUrl.pathname.startsWith('/tasks/') && req.method === 'DELETE') {
        const index = tasks.findIndex(t => t.id == id);
        if (index !== -1) {
            const deleted = tasks.splice(index, 1);
            return sendResponse(200, { message: 'Task deleted', deleted });
        } else {
            return sendResponse(404, { error: 'Task not found' });
        }
    }

    // Fallback
    sendResponse(404, { error: 'Not Found' });
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));




const http = require('http');
const url = require('url');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const SECRET_KEY = "supersecret"; // store in .env in production
let users = []; // In-memory storage

const sendResponse = (res, status, data) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
};

const parseBody = (req) => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(JSON.parse(body)));
});

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // REGISTER
    if (parsedUrl.pathname === '/register' && req.method === 'POST') {
        const { username, password } = await parseBody(req);
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ username, password: hashedPassword });
        return sendResponse(res, 201, { message: "User registered" });
    }

    // LOGIN
    if (parsedUrl.pathname === '/login' && req.method === 'POST') {
        const { username, password } = await parseBody(req);
        const user = users.find(u => u.username === username);
        if (!user) return sendResponse(res, 401, { error: "Invalid credentials" });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return sendResponse(res, 401, { error: "Invalid credentials" });

        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        return sendResponse(res, 200, { token });
    }

    // PROTECTED ROUTE
    if (parsedUrl.pathname === '/profile' && req.method === 'GET') {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return sendResponse(res, 401, { error: "No token provided" });

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            return sendResponse(res, 200, { message: "Welcome!", user: decoded.username });
        } catch {
            return sendResponse(res, 403, { error: "Invalid token" });
        }
    }

    sendResponse(res, 404, { error: "Not Found" });
});

server.listen(3000, () => console.log("Server running at http://localhost:3000"));
