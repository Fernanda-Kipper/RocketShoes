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

interface ProductFromApi{
  id: number;
  title: string;
  price: number;
  image: string;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      
      let productAmountNeeded = cart.reduce((amount,product) => {
        if(product.id === productId){
          amount += product.amount
        }
        return amount
      },1)
      
      let matchProductStock:Stock = await api.get(`stock/${productId}`).then(res => res.data)
      
      if (matchProductStock.amount < productAmountNeeded){
        toast.error('Quantidade solicitada fora de estoque')
      }else{
        let product: ProductFromApi = await api.get(`/products/${productId}`).then(res => res.data)
        switch(productAmountNeeded){
          case 1:
            {
              let newProduct = {...product, amount: productAmountNeeded}
              setCart([...cart, newProduct])
              localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]))
              break
            }
            default:
              {
                let newCart = cart.map(product => {
                  if(productId === product.id){
                    product.amount = productAmountNeeded
                    return product
                  }
                  return product
                })
                setCart(newCart)
                localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
              }
        }
      }
    } catch(err){
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let productExistOnCart = false
      
      let newCart = cart.filter(product => {
        if (product.id === productId){
          productExistOnCart = true
        }
        return product.id !== productId
      })
      
      if(productExistOnCart === false){
        toast.error('Erro na remoção do produto')
      }else{
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        setCart(newCart)
      }

    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0){
        toast.error('Erro na alteração de quantidade do produto')
        return
      }

      let matchProductStock:Stock = await api.get(`stock/${productId}`).then(res => res.data)

      if (matchProductStock.amount >= amount){
        let newCart = cart.map(product => {
        if(product.id === productId){
          product.amount = amount
        }
          return product
        })
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        setCart(newCart)
      }else{
        // amount needed is greather then stock
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
