import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {

    try {
      var t0 = performance.now();

      const productIndex = cart.findIndex(product => product.id === productId);

      if (productIndex > -1) {
        const product = cart[productIndex];
        updateProductAmount({ productId, amount: product.amount + 1 });
      } else {
        const response = await api.get(`/products/${productId}`);
        const product = response.data;

        product.amount = 1;

        setCart([...cart, product]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]));
      }

      var t1 = performance.now()
      console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.")
    }
    catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);

      if (productIndex > -1) {
        const newProductCartList = [...cart];
        newProductCartList.splice(productIndex, 1);

        setCart(newProductCartList);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProductCartList));
      } else {
        throw new Error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const hasProductStoke = await hasProductAmountInStock(productId, amount);

      if (hasProductStoke) {
        const productIndex = cart.findIndex(product => product.id === productId);

        const updatedProduct = cart[productIndex];
        updatedProduct.amount = amount;

        const newProductCartList = [...cart];
        newProductCartList.splice(productIndex, 1, updatedProduct);

        setCart(newProductCartList);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  const hasProductAmountInStock = async (productId: number, productAmount: number) => {
    const response = await api.get('/stock');
    const stock: Stock[] = response.data;

    const product = stock.find(product => product.id === productId);

    if (product) {
      return product.amount >= productAmount;
    }

    return false;
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
