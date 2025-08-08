import {server} from './app.js';
import 'dotenv/config.js';
import connectDB from './db/db.js';


const PORT = process.env.PORT || 5000;

connectDB()

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});



