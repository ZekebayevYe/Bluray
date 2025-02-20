import Product from '../models/Product.js';
import Log from '../models/Log.js';

export const createProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            description,
            stock,
            images,
            rating,
            categories
        } = req.body;

        let catArray = [];
        if (Array.isArray(categories)) {
            catArray = categories;
        } else if (typeof categories === 'string' && categories.trim() !== '') {
            catArray = categories.split(',').map(c => c.trim());
        }

        if (catArray.length > 3) {
            catArray = catArray.slice(0, 3);
        }

        let imgArray = [];
        if (Array.isArray(images)) {
            imgArray = images;
        } else if (typeof images === 'string' && images.trim() !== '') {
            imgArray = images.split(',').map(i => i.trim());
        }

        const product = new Product({
            name,
            price,
            description,
            stock,
            rating: Number(rating) || 0,
            categories: catArray,
            images: imgArray
        });
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating product' });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            description,
            stock,
            image,
            rating,
            categories
        } = req.body;

        let catArray = [];
        if (categories) {
            if (Array.isArray(categories)) {
                catArray = categories;
            } else if (typeof categories === 'string' && categories.trim() !== '') {
                catArray = categories.split(',').map(c => c.trim());
            }
            if (catArray.length > 3) {
                catArray = catArray.slice(0, 3);
            }
        }

        let imgArray = [];
        if (images) {
            if (Array.isArray(images)) {
                imgArray = images;
            } else if (typeof images === 'string' && images.trim() !== '') {
                imgArray = images.split(',').map(i => i.trim());
            }
        }

        const updatedFields = {};
        if (name) updatedFields.name = name;
        if (price) updatedFields.price = price;
        if (description) updatedFields.description = description;
        if (stock) updatedFields.stock = stock;
        if (catArray.length) updatedFields.categories = catArray;
        if (imgArray.length) updatedFields.images = imgArray;
        if (rating !== undefined) updatedFields.rating = rating;

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updatedFields,
            { new: true }
        );
        res.json(updatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating product' });
    }
};
export const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        await Product.findByIdAndDelete(productId);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting product' });
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const { search, inStock, categories } = req.query;

        const query = {};

        if (search) {
            query.$text = { $search: search };
        }

        if (inStock) {
            query.stock = { $gt: 0 };
        }

        let products = await Product.find(query);

        if (categories) {
            const catArr = categories.split(',').map(c => c.trim()).filter(c => c !== '');
            if (catArr.length) {
                const fullMatch = products.filter(p =>
                    catArr.every(cat => p.categories.includes(cat))
                );
                const partialMatch = products.filter(p =>
                    catArr.some(cat => p.categories.includes(cat)) && !fullMatch.includes(p)
                );
                products = [...fullMatch, ...partialMatch];
            }
        }
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching products' });
    }
};

export const getProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (req.user) {
            await Log.create({
                user: req.user.id,
                action: 'view_product',
                details: `Viewed product: ${product._id}`
            });
        }

        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching product' });
    }
};