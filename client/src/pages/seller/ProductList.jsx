import React from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const ProductList = () => {
    const { products, currency, axios, fetchProducts } = useAppContext()

    // Toggle product stock status
    const toggleStock = async (id, inStock) => {
        try {
            const response = await axios.post('/api/product/stock', {
                id: id,
                inStock: inStock
            })

            if (response.data.success) {
                fetchProducts()
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    return (
        <div>
            <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col">
                <h2 className="pb-4 text-lg font-medium">All Products</h2>

                <div className="flex flex-col items-center max-w-4xl w-full rounded-md bg-white border border-gray-500/20">
                    <table className="w-full table-fixed">
                        <thead className="text-gray-900 text-sm text-left">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Product</th>
                                <th className="px-4 py-3 font-semibold">Category</th>
                                <th className="px-4 py-3 font-semibold hidden md:block">
                                    Selling Price
                                </th>
                                <th className="px-4 py-3 font-semibold">In Stock</th>
                            </tr>
                        </thead>

                        <tbody className="text-sm text-gray-500">
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-6">
                                        No products found
                                    </td>
                                </tr>
                            )}

                            {products.map((product) => (
                                <tr
                                    key={product._id}
                                    className="border-t border-gray-500/20"
                                >
                                    <td className="px-4 py-3 flex items-center gap-3">
                                        <img
                                            src={product.image[0]}
                                            alt={product.name}
                                            className="w-16 border rounded"
                                        />
                                        <span className="truncate max-sm:hidden">
                                            {product.name}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3">
                                        {product.category}
                                    </td>

                                    <td className="px-4 py-3 hidden md:block">
                                        {currency}
                                        {product.offerPrice}
                                    </td>

                                    <td className="px-4 py-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={product.inStock}
                                                onChange={() =>
                                                    toggleStock(
                                                        product._id,
                                                        !product.inStock
                                                    )
                                                }
                                                className="sr-only peer"
                                            />

                                            <div className="w-12 h-7 bg-slate-300 rounded-full peer-checked:bg-blue-600 transition"></div>

                                            <span className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition peer-checked:translate-x-5"></span>
                                        </label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default ProductList
