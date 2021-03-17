import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
  const [stock, setStock] = useState<Stock[]>([])
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(()=>{
    api.get('/stock')
    .then(res => setStock(res.data))
  },[])

  const addProduct = async (productId: number) => {
    try {

      let hasProductOnCart
      cart.forEach(product => {
        if (product.id === productId){
          updateProductAmount({productId, amount: product.amount})
          hasProductOnCart = true
        }
      })

      if(hasProductOnCart){
        return
      }

      let hasStock
      stock.forEach(product => {
        if (product.id === productId){
          console.log(product)
          if(product.amount > 0){
            hasStock = true
          }
        }
      })

      if (hasStock === true){
        const product = {...await api.get(`/products/${productId}`).then(res => res.data), amount: 1}
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]))
        setCart([...cart, product])
      }else{
        toast.error('Quantidade solicitada fora de estoque')
      }

    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0){
        throw Error('Erro na quantidade do produto')
      }

      let hasStock
      stock.forEach(product => {
        if (product.id === productId){
          console.log(product)
          if(product.amount >= amount + 1){
            hasStock = true
          }
          else{
            hasStock = false
          }
        }
      })

      if(hasStock === true){
        let newCart = cart.map(product => {
          if(product.id === productId){
            product.amount += 1
          }
          return product
        })
        setCart(newCart)
      }
      else{
        toast.error('Quantidade solicitada fora de estoque')
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

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
