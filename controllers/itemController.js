const Item = require('../models/item');
const Category = require('../models/category');
const {
    body,
    validationResult
} = require('express-validator');
const async = require('async');

exports.itemList = (req, res) => {
    Item.find({}, 'name description')
        .sort([
            ['name']
        ])
        .exec((err, items) => {
            if (err) {
                return next(err);
            }
            res.render('item_list', {
                title: 'Items',
                items
            });
        });
};

exports.itemDetail = (req, res, next) => {
    Item.findById(req.params.id)
        .populate('category')
        .exec((err, item) => {
            if (err) {
                return next(err);
            }

            if (item === null) {
                let err = new Error('Item not found');
                err.status = 404;
                return next(err);
            }

            res.render('item_detail', {
                title: 'Item Detail',
                item
            });
        });
};

exports.itemCreateGet = (req, res, next) => {
    Category.find().exec((err, results) => {
        if (err) {
            return next(err);
        }
        return res.render('item_form', {
            title: 'Create Item',
            categories: results
        });
    });
};

exports.itemCreatePost = [
    body('name', 'Name is required').trim().isLength({
        min: 1
    }).escape(),
    body('description', 'Description is required').trim().isLength({
        min: 1
    }).escape(),
    body('category').trim().isLength({
        min: 1
    }).escape(),
    body('price', 'Price is required').trim().isCurrency(),
    body('numberInStock', 'Number in stock is required').trim().isInt({
        min: 0
    }),

    (req, res, next) => {
        console.log('in the method')
        const errors = validationResult(req);
        console.log(errors.array());

        const item = new Item({
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            price: req.body.price,
            numberInStock: req.body.numberInStock
        });
        console.log(`Item ${item} created`)

        if (!errors.isEmpty()) {
            console.log('There are errors.')
            Category.find({}, 'name').exec((err, categories) => {
                if (err) {
                    console.log(`Couldn't find categories: ${err}`)
                    return next(err);
                }
                console.log('Re-rendering form')
                console.log(`Categories: ${categories}`)
                console.log(`Item: ${item}`)
                return res.render('item_form', {
                    title: 'Create Item',
                    categories,
                    item,
                    errors: errors.array()
                });
            });
        } else {

            item.save((err) => {
                if (err) {
                    console.log(`We had a problem saving: ${err}`)
                    // return next(err);
                    return res.render('item_form', {
                        title: 'Create Item',
                        categories,
                        item,
                        errors: errors.array()
                    });
                }
                console.log('Item saved')
                return res.redirect(item.url)
            });
        }
    }
];

exports.itemUpdateGet = (req, res, next) => {
    async.parallel({
        item: (callback) => {
            Item.findById(req.params.id).populate('category').exec(callback);
        },
        categories: (callback) => {
            Category.find(callback);
        }
    },
    (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.item === null) {
            let err = new Error('Item not found');
            err.status = 404;
            return next(err);
        }
        return res.render('item_form', {title: 'Item Update', item: results.item, categories: results.categories});
    });
};

exports.itemUpdatePost = [
    body('name', 'Name is required').trim().isLength({min: 1}).escape(),
    body('description', 'Description is required').trim().isLength({min: 1}).escape(),
    body('category', 'Category is required').trim().isLength({min: 1}).escape(),
    body('price', 'Price is required').trim().isLength({min: 1}).escape(),
    body('numberInStock', 'Number in stock is required').trim().isLength({min: 1}).escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        const item = new Item({
            _id: req.params.id,
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            price: req.body.price,
            numberInStock: req.body.numberInStock
        });

        if (!errors.isEmpty()) {
            Category.find().exec((err, categories) => {
                if (err) {
                    return next(err);
                }
                return res.render('item_form', {
                    title: 'Item Update',
                    item,
                    categories,
                    errors: errors.array()
                });
            })
        }

        Item.findByIdAndUpdate(req.params.id, item, (err, results) => {
            if (err) {
                return next(err);
            }

            return res.redirect(item.url);
        })
    }
];

exports.itemDeleteGet = (req, res, next) => {
    Item.findById(req.params.id).exec((err, item) => {
        if (err) {
            return next(err);
        }

        if (item === null) {
            return res.redirect('/catalog/items');
        }

        return res.render('item_delete', {title: 'Delete Item', item});
    });
};

exports.itemDeletePost = (req, res, next) => {
    Item.findByIdAndDelete(req.params.id).exec((err, item) => {
        if (err) {
            return next(err);
        }

        return res.redirect('/catalog/items');
    });
};