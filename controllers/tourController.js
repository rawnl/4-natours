const Tour = require('./../models/tourModel');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingAverage,price';
    req.query.fields =
        'name,price,ratingAverage,summary,difficulty';
    next();
};

exports.getAllTours = async (req, res) => {
    try {
        // BUILDING QUERY
        // 1. FILTERING
        const queryObj = { ...req.query };
        const excludedFields = [
            'page',
            'sort',
            'limit',
            'fields',
        ];
        excludedFields.forEach((el) => delete queryObj[el]);

        // 2. ADVANCED FILTERING
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        );
        //console.log(JSON.parse(queryStr));
        //console.log(req.query, queryObj);

        let query = Tour.find(JSON.parse(queryStr));

        // 3. Sorting
        if (req.query.sort) {
            const sortBy = req.query.sort
                .split(',')
                .join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // 4. Field Limiting
        if (req.query.fields) {
            const fields = req.query.fields
                .split(',')
                .join(' ');
            query = query.select(fields);
        } else {
            query = query.select('-__v');
        }

        // 5. Pagination
        const page = req.query.page * 1 || 1;
        const limit = req.query.limit * 1 || 100;
        const skip = limit * (page - 1);

        if (req.query.page) {
            const numTours = await Tour.countDocuments();
            if (skip >= numTours)
                throw new Error('This page does not exist');
        }

        query = query.skip(skip).limit(limit);

        // EXECUTE QUERY
        const tours = await query;

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            requestedAt: req.requestTime,
            results: tours.length,
            data: {
                tours,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};
exports.getTour = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id); // Tour.findOne({_id: req.params.id})

        res.status(200).json({
            status: 'success',
            data: tour,
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.createTour = async (req, res) => {
    try {
        const newTour = await Tour.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                tour: newTour,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.updateTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json({
            status: 'success',
            data: {
                tour: tour,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err,
        });
    }
};

/*///////////////////////////
OLD VERSION - USING JSON FILE
/////////////////////////////

////////////////////////////
const tours = JSON.parse(
    fs.readFileSync(
        `${__dirname}/../dev-data/data/tours-simple.json`
    )
);

exports.checkID = (req, res, next, val) => {
    console.log(`Tour id is ${val}`);
    if (req.params.id * 1 > tours.length) {
        return res.status(404).json({
            status: 'fail',
            data: 'Invalid ID',
        });
    }
    next();
};

exports.checkBody = (req, res, next) => {
    console.log(`req.body is ${req}`);
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({
            status: 'fail',
            data: 'Bad request',
        });
    }
    next();
};

exports.getAllTours = (req, res) => {
    console.log(req.requestTime);
    res.status(200).json({
        status: 'success',
        results: tours.length,
        requestedAt: req.requestTime,
        data: {
            tours,
        },
    });
};

exports.getTour = (req, res) => {
    console.log(req.params);

    const id = req.params.id * 1;
    const tour = tours.find((el) => el.id === id);

    res.status(200).json({
        status: 'success',
        data: {
            tour,
        },
    });
};

exports.createTour = (req, res) => {
    const newId = tours[tours.length - 1].id + 1;

    const newTour = Object.assign({ id: newId }, req.body);

    tours.push(newTour);

    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(tours),
        (err) => {
            res.status(201).json({
                status: 'success',
                data: {
                    tour: newTour,
                },
            });
        }
    );
};

exports.updateTour = (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            tour: '<Updated tour here..>',
        },
    });
};

exports.deleteTour = (req, res) => {
    res.status(204).json({
        status: 'success',
        data: null,
    });
};
//////////////////////////////////////

*/
