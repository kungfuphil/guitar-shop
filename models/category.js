const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 240
    }
});

CategorySchema.virtual('url').get(function() {
    return `/catalog/category/${this._id}`;
});

module.exports = mongoose.model('Category', CategorySchema);