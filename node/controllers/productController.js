const admin = require('firebase-admin');
const db = admin.firestore();

const getProducts = async (req, res) => {
  try {
    const productsRef = db.collection('products').where('createdBy', '==', req.user.uid);
    const snapshot = await productsRef.get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

const addProduct = async (req, res) => {
  const { name, description, category, price, imageUrl } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ message: 'Missing required fields: name, category, price' });
  }
  if (typeof price !== 'number') {
    return res.status(400).json({ message: 'Price must be a number' });
  }

  try {
    const productRef = db.collection('products').doc();
    const productData = {
      name,
      description: description || '',
      category,
      price,
      imageUrl: imageUrl || '',
      createdBy: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await productRef.set(productData);
    res.status(201).json({ id: productRef.id, ...productData });
  } catch (error) {
    res.status(500).json({ message: 'Error adding product', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, category, price, imageUrl } = req.body;

  try {
    const productRef = db.collection('products').doc(id);
    const product = await productRef.get();
    if (!product.exists || product.data().createdBy !== req.user.uid) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    const updateData = {
      name: name || product.data().name,
      description: description || product.data().description,
      category: category || product.data().category,
      price: price !== undefined ? price : product.data().price,
      imageUrl: imageUrl || product.data().imageUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (updateData.price !== undefined && typeof updateData.price !== 'number') {
      return res.status(400).json({ message: 'Price must be a number' });
    }

    await productRef.update(updateData);
    res.json({ id, ...updateData });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const productRef = db.collection('products').doc(id);
    const product = await productRef.get();
    if (!product.exists || product.data().createdBy !== req.user.uid) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    await productRef.delete();
    res.json({ message: 'Product deleted', id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

module.exports = { getProducts, addProduct, updateProduct, deleteProduct };