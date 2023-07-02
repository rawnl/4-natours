const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

// Local Database
//     .connect(process.env.DATABASE_LOCAL)
//     .then((connection) => {
//         console.log(connection.connections);
//         console.log('DB connection successful');
//     })
//     .catch((err) => console.log(err));

// Atlas Database

mongoose.connect(DB).then(() => {
    console.log('Database connection successful');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}..`);
});
