const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res) => {
    // 1. Get tour data from collection
    const tours = await Tour.find();

    // 2. Build template

    // 3. Render that template using tour data from step 1

    res.status(200).render('overview', {
        title: 'All tours',
        tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // 1. Get tour data (including reviews & tour guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user',
    });

    if (!tour) {
        return next(new AppError('No tour found with that name.', 404));
    }
    // 2. build Template

    // 3. Render template using the data from step 1
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour,
    });
});

exports.getLoginForm = catchAsync(async (req, res) => {
    res.status(200).render('login', {
        title: 'Log in',
    });
});

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account',
    });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser,
    });
});
