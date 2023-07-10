const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message);
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down');

    process.exit(1);
});

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
const server = app.listen(port, () => {
    console.log(`App running on port ${port}..`);
});

process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION! 💥 Shutting down');
    server.close(() => {
        process.exit(1);
    });
});
