const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, `Review can not be empty`],
            trim: true,
        },
        rating: {
            type: Number,
            required: [true, ''],
            min: [1, 'A rating must be at least 1'],
            max: [5, 'A rating must be less than or equal to 5'],
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour.'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user.'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name',
    // }).populate({
    //     path: 'user',
    //     select: 'name photo',
    // });

    this.populate({
        path: 'user',
        select: 'name photo',
    });
    next();
});

// static method => called: Review.calcAverageRatings
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: stats[0].nRating,
            ratingAverage: stats[0].avgRating,
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: 0,
            ratingAverage: 4.5,
        });
    }
};

reviewSchema.post('save', function () {
    // this points to current review
    this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
    const clonedQuery = this.clone();
    this.r = await clonedQuery.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    // this.findOne() DOES NOT WORK here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
