const {
    body,
    validationResult
} = require('express-validator');
const async = require('async');

const Category = require('../models/category');
const Item = require('../models/item');

exports.categoryList = (req, res) => {
    Category.find({}, 'name description')
        .sort([
            ['name']
        ])
        .exec((err, categories) => {
            if (err) {
                return next(err);
            }
            res.render('category_list', {
                title: 'Categories',
                categories
            });
        });
};

exports.categoryDetail = (req, res, next) => {
    async.parallel({
            category: (callback) => {
                Category.findById(req.params.id).exec(callback);
            },
            categoryItems: (callback) => {
                Item.find({
                    'category': req.params.id
                }).exec(callback);
            }
        },
        (err, results) => {
            if (err) {
                return next(err);
            }

            if (results.category === null) {
                let err = new Error('Category not found');
                err.status = 404;
                return next(err);
            }

            return res.render('category_detail', {
                title: 'Category Detail',
                category: results.category,
                categoryItems: results.categoryItems
            });
        });
};

// create get
exports.categoryCreateGet = (req, res, next) => {
    return res.render('category_form', {
        title: 'Create Category'
    });
};

// create post
exports.categoryCreatePost = [
    body('name', 'Name is required').trim().isLength({
        min: 1
    }).escape(),
    body('description', 'Description is required').trim().isLength({
        min: 1
    }).escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        const category = new Category({
            name: req.body.name,
            description: req.body.description
        });

        if (!errors.isEmpty()) {
            return res.render('category_form', {
                title: 'Create Category',
                category,
                errors: errors.array()
            });
        }

        Category.findOne({'name': req.body.name})
            .exec((err, result) => {
                if (err) {
                    return next(err);
                }

                // If this category already exists
                if (result) {
                    return res.redirect(result.url);
                }

                category.save((err) => {
                    if (err) {
                        return next(err);
                    }

                    return res.redirect(category.url);
                });

            });
    }
];

// update get
exports.categoryUpdateGet = (req, res, next) => {
    Category.findById(req.params.id).exec((err, category) => {
        if (err) {
            return next(err);
        }
        res.render('category_form', {title: 'Update Category', category});
    });
};

// update post
exports.categoryUpdatePost = [
    body('name', 'Name is required').trim().isLength({
        min: 1
    }).escape(),
    body('description', 'Description is required').trim().isLength({
        min: 1
    }).escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        const category = new Category({
            _id: req.params.id,
            name: req.body.name,
            description: req.body.description
        });

        if (!errors.isEmpty()) {
            return res.render('category_form', {
                title: 'Create Category',
                category,
                errors: errors.array()
            });
        }

        Category.findByIdAndUpdate(req.params.id, category, (err, results) => {
            if (err) {
                return next(err);
            }

            return res.redirect(results.url);
        });
    }
];

// delete get
exports.categoryDeleteGet =  (req, res, next) => {
    async.parallel({
        category: (callback) => {
            Category.findById(req.params.id).exec(callback);
        },
        categoryItems: (callback) => {
            Item.find({'category': req.params.id}).exec(callback);
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }

        if (results.category === null) {
            return res.redirect('/catalog/categories');
        }

        return res.render('category_delete.pug', {title: 'Delete Category', category: results.category, categoryItems: results.categoryItems});
    })
};

// delete post
exports.categoryDeletePost = (req, res, next) => {
    console.log('delete post has been called')
    Category.findByIdAndDelete(req.params.id).exec((err, category) => {
        if (err) {
            return next(err);
        }

        return res.redirect('/catalog/categories');
    });
};