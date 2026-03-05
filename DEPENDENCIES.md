# Dependencies

What we used for iteration 1 (auth). Run npm install in the project root and again in server/.

Frontend: react, react-dom, react-router-dom, bootstrap, vite, typescript, @vitejs/plugin-react. Check package.json for versions.

Server: express, mongoose, bcryptjs, jsonwebtoken, express-validator, cors, dotenv, tsx, typescript, plus the @types for express, node, bcryptjs, cors, jsonwebtoken.

MongoDB: The server uses mongoose to connect. You need MongoDB running somewhere (local or Atlas). We don't install it via npm. Put the connection string in server/.env as MONGODB_URI. Local default is mongodb://localhost:27017/clearpath. For Atlas, create a cluster and paste the connection string they give you.

Env: Copy server/.env.example to server/.env and set MONGODB_URI, JWT_SECRET, and PORT. In the project root add a .env with VITE_API_URL pointing at your API (e.g. http://localhost:8080/api). Restart the frontend after changing .env.

To run: Start MongoDB, then npm run dev in server/, then npm run dev in the project root.
