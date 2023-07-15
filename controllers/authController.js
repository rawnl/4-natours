const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendMail = require('./../utils/email');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined; // Remove password from output

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.password,
        //passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role,
    });

    createAndSendToken(newUser, 201, res);

    // const token = signToken(newUser._id);

    // res.status(201).json({
    //     status: 'success',
    //     token,
    //     data: {
    //         user: newUser,
    //     },
    // });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // check existance of email & password
    if (!email || !password) {
        return next(new AppError('Please provide e-mail and password', 400));
    }
    // check if user exists & password correct
    const user = await User.findOne({ email }).select(['+password']);

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // send the token if everything wotks
    createAndSendToken(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token,
    // });
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1. Check the user token
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Please log in to get access!', 401));
    }

    console.log({ token });
    console.log(req.headers.authorization);

    // 2. Validate token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(
            new AppError(
                'The user belonging to this token does no longer exist.',
                401
            )
        );
    }

    // 4. Check if user has changed the password after the token was issued
    if (freshUser.passwordHasChanged(decoded.iat)) {
        return next(
            new AppError(
                'User recently changed password! please log in again.',
                401
            )
        );
    }

    // 5. Grant access to the protected route
    req.user = freshUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action',
                    403
                )
            );
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(
            new AppError('There is no user with this email address', 404)
        );
    }

    // 2. Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3. Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfrim to: ${resetURL}.\n If you didn't forget your password ignore this email`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset token - valid for 10 min',
            message: message,
        });

        res.status(200).json({
            status: 'success',
            message: 'Token send to email!',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(
            new AppError(
                'There was an error sending the mail. try again later',
                500
            )
        );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1. get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    // 2. set new password if token has not expired & there is user
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 3. update changedPasswordAt property

    // 4. log the user in
    createAndSendToken(user, 200, res);
    // const token = signToken(user._id);

    // res.status(200).json({
    //     status: 'success',
    //     token,
    // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1. Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2. Check if POSTed current password is correct
    if (
        !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
        return next(new AppError('Your current password is wrong', 401));
    }

    // 3. If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save(); // user.findByIdAndUpdate is not gonna work

    // 4. Log user in, send JWT
    createAndSendToken(user, 200, res);
    // res.status(200).json({
    //     status: 'success',
    //     user: user,
    // });
});