const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Middleware para el manejo de JSON
app.use(express.json());

// Clases Product y ProductManager
class Product {
    constructor(title, description, price, thumbnail, code, stock) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.thumbnail = thumbnail;
        this.code = code;
        this.stock = stock;
        this.id = Math.random().toString(36).substr(2, 9); // Generando un ID aleatorio
    }
}

class ProductManager {
    constructor(filePath) {
        this.filePath = filePath;
        this.products = this.loadProductsFromFile() || [];
    }

    loadProductsFromFile() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log("Error leyendo el archivo:", error.message);
            return null;
        }
    }

    saveProductsToFile() {
        try {
            const data = JSON.stringify(this.products, null, 2);
            fs.writeFileSync(this.filePath, data);
            console.log("Productos guardados en el archivo exitosamente.");
        } catch (error) {
            console.log("Error escribiendo en el archivo:", error.message);
        }
    }

    getProducts() {
        return this.products;
    }

    addProduct(title, description, price, thumbnail, code, stock) {
        const existingProduct = this.products.find(product => product.code === code);
        if (existingProduct) {
            throw new Error("El código de producto ya está en uso");
        }

        const newProduct = new Product(title, description, price, thumbnail, code, stock);
        this.products.push(newProduct);
        this.saveProductsToFile();
    }

    getProductById(productId) {
        const product = this.products.find(product => product.id === productId);
        if (!product) {
            throw new Error("Producto no encontrado");
        }
        return product;
    }

    updateProduct(productId, updatedFields) {
        const productIndex = this.products.findIndex(product => product.id === productId);
        if (productIndex === -1) {
            throw new Error("Producto no encontrado");
        }

        this.products[productIndex] = { ...this.products[productIndex], ...updatedFields };
        this.saveProductsToFile();
    }

    deleteProduct(productId) {
        const productIndex = this.products.findIndex(product => product.id === productId);
        if (productIndex === -1) {
            throw new Error("Producto no encontrado");
        }

        this.products.splice(productIndex, 1);
        this.saveProductsToFile();
    }

    searchProducts(query) {
        return this.products.filter(product =>
            product.title.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );
    }

    sortProductsByPrice(order = 'asc') {
        return this.products.slice().sort((a, b) => {
            if (order === 'asc') {
                return a.price - b.price;
            } else {
                return b.price - a.price;
            }
        });
    }
}

// Rutas
const manager = new ProductManager('products.json');

// Middleware para comprobar que existan al menos 10 productos
app.use((req, res, next) => {
    if (manager.getProducts().length < 10) {
        return res.status(500).json({ error: "No hay suficientes productos creados." });
    }
    next();
});

// Ruta para obtener todos los productos o una cantidad limitada
app.get('/products', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    let products = manager.getProducts();
    if (limit) {
        products = products.slice(0, limit);
    }
    res.json(products);
});

// Ruta para obtener un producto por su ID
app.get('/products/:productId', (req, res) => {
    const productId = req.params.productId;
    try {
        const product = manager.getProductById(productId);
        res.json(product);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Hubo un error en el servidor' });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
